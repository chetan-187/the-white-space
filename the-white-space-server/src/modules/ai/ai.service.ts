import Anthropic from '@anthropic-ai/sdk';
import { svgPathProperties } from 'svg-path-properties';
import { config } from '../../config/env';
import { Segment } from './ai.types';

const client = new Anthropic({ apiKey: config.anthropicApiKey });

const CANVAS_SIZE = 5000;
const DRAWING_BOX_SIZE = 700;

// Distance in px between points sampled along each SVG path. Smaller = smoother.
const SAMPLE_SPACING = 8;
const MAX_POINTS_PER_PATH = 600;

// The model outputs SVG path data instead of raw point lists — models draw far
// more accurately with Béziers, and we flatten the curves into line segments
// mathematically, so smoothness never depends on the model's arithmetic.
const DRAWING_SCHEMA = {
  type: 'object',
  properties: {
    paths: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['paths'],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You are an expert vector illustrator for a shared whiteboard.

CANVAS: ${CANVAS_SIZE}x${CANVAS_SIZE}px. Origin (0,0) is top-left, y increases downward.
Output is stroked only (5px black round-cap, round-join, no fill) unless the user message says otherwise.

## Output format (strict)
Return ONLY valid JSON, no prose, no markdown fences:
{
  "plan": [
    { "part": "trunk", "anchor_points": {"crown": [x,y], "base": [x,y]}, "notes": "tapered, wider at base" },
    { "part": "fronds_left", "anchor_points": {"origin": [x,y]}, "notes": "must start exactly at trunk.crown" }
  ],
  "paths": [
    { "part": "trunk", "d": "M ... C ... Z" },
    { "part": "fronds_left", "d": "M ... C ..." }
  ]
}

## Planning rules (do this before writing any "d" string)
1. List every anatomical/structural part of the subject and assign each a bounding sub-region within the overall bbox, based on real-world proportions (e.g. a palm crown occupies the top ~15% of trunk height at its widest, fronds radiate from one point, not a spread of points).
2. Pick ONE shared anchor coordinate for every place where two parts must visually connect (e.g. trunk-top, frond-origin). Reuse that exact [x,y] pair in both paths — never re-estimate it in the second path.
3. If the subject has bilateral symmetry (wings, leaves, eyes), compute one side's control points, then generate the mirror side by reflecting across the symmetry axis (same x-distance from axis, same y), not by eyeballing a second curve.

## Curve construction rules
- Use C/Q for every organic edge. Control points should be roughly tangent to the curve's direction of travel at that point — not placed perpendicular or arbitrarily, or you get lumpy/bulging curves.
- For tapering forms (trunks, limbs, horns): draw as a single closed path with two edges that visibly converge — one edge's width relative to the other must change monotonically, not stay parallel.
- For repeated elements (waves, scales, fur), vary amplitude/spacing/phase slightly between instances (±10-20%) — perfect repetition looks robotic.
- L only for genuinely straight man-made edges (horizon lines, buildings). Never for organic silhouettes.
- Close solid outlines with Z. One subpath per path string (exactly one M).

## Detail rules
- Every recognizability feature must exist as its own stroked path: eyes, mouth, wing lines, texture bands, etc. Small circles for eyes/nodes should sit centered on the part they belong to, not floating adjacent to it.
- Budget: simple subject (bird, leaf) → 3-6 paths. Medium (tree, animal) → 6-12 paths. Complex scene → decompose per-subject using this same budget, then compose.

## Self-check before returning (do silently, then fix issues, then output)
- Does every "must connect" pair of anchor points listed in the plan appear as an identical coordinate in both relevant paths?
- Are all coordinates within [0, ${CANVAS_SIZE}]?
- Do closed shapes actually close (Z) and are they non-self-intersecting?
- Does the silhouette match real-world proportions of the subject (re-read your own plan's proportions and compare)?

## Example (format reference only, not a style template)
{"plan":[{"part":"wing","anchor_points":{"shoulder":[400,300]},"notes":"single upward arc, tip higher than shoulder"}],
"paths":[{"part":"wing","d":"M 400,300 Q 460,240 520,280"}]}
`;

function flattenPathToPolylines(d: string): Array<Array<{ x: number; y: number }>> {
  // Split on M/m so a multi-subpath string can't produce a stray connecting line
  const subpaths = d.split(/(?=[Mm])/).map((s) => s.trim()).filter(Boolean);
  const polylines: Array<Array<{ x: number; y: number }>> = [];

  for (const subpath of subpaths) {
    try {
      const properties = new svgPathProperties(subpath);
      const length = properties.getTotalLength();
      if (!isFinite(length) || length <= 0) continue;

      const steps = Math.min(
        Math.max(Math.ceil(length / SAMPLE_SPACING), 1),
        MAX_POINTS_PER_PATH,
      );

      const points: Array<{ x: number; y: number }> = [];
      for (let i = 0; i <= steps; i++) {
        const point = properties.getPointAtLength((length * i) / steps);
        points.push({ x: point.x, y: point.y });
      }
      polylines.push(points);
    } catch {
      // Skip malformed path strings rather than failing the whole drawing
      continue;
    }
  }

  return polylines;
}

export const AiService = {
  async generateDrawing(prompt: string): Promise<Segment[]> {
    // Random placement so consecutive AI drawings don't stack on each other
    const originX = 200 + Math.floor(Math.random() * 2000);
    const originY = 200 + Math.floor(Math.random() * 1500);
    const maxX = originX + DRAWING_BOX_SIZE;
    const maxY = originY + DRAWING_BOX_SIZE;

    const stream = client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 64000,
      thinking: { type: 'adaptive' },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Draw: ${prompt}\nBounding box: from (${originX}, ${originY}) to (${maxX}, ${maxY}).`,
        },
      ],
      output_config: {
        effort: 'xhigh',
        format: { type: 'json_schema', schema: DRAWING_SCHEMA },
      },
    });

    const message = await stream.finalMessage();

    if (message.stop_reason === 'refusal') {
      throw new Error('The AI declined to draw that. Try a different prompt.');
    }
    if (message.stop_reason === 'max_tokens') {
      throw new Error('The drawing was too complex to generate. Try a simpler prompt.');
    }

    const textBlock = message.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('The AI returned no drawing data.');
    }

    const parsed = JSON.parse(textBlock.text) as { paths: string[] };

    const clamp = (value: number) =>
      Math.min(Math.max(Math.round(value), 0), CANVAS_SIZE);

    const segments: Segment[] = [];
    for (const path of parsed.paths) {
      for (const polyline of flattenPathToPolylines(path)) {
        for (let i = 0; i < polyline.length - 1; i++) {
          const segment = {
            x1: clamp(polyline[i].x),
            y1: clamp(polyline[i].y),
            x2: clamp(polyline[i + 1].x),
            y2: clamp(polyline[i + 1].y),
          };
          // Skip zero-length segments produced by rounding
          if (segment.x1 === segment.x2 && segment.y1 === segment.y2) continue;
          segments.push(segment);
        }
      }
    }

    if (segments.length === 0) {
      throw new Error('The AI returned an empty drawing. Try rephrasing the prompt.');
    }

    return segments;
  },
};
