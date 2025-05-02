import React, { useState } from "react";
import { styled } from "@mui/material/styles";
import Avatar from "@mui/material/Avatar";
import Tooltip, { TooltipProps } from "@mui/material/Tooltip";
import Popover from "@mui/material/Popover";

type User = {
    id: string;
    name: string;
    color: string;
};

type ActiveUsersProps = {
    users: Record<string, User>;
};

const Container = styled("div")(({ theme }) => ({
    position: "fixed",
    top: "16px",  // Use fixed pixel values instead of theme spacing
    right: "16px",
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    backgroundColor: "#f8f9fa",
    boxShadow: "4px 4px 0px rgba(0, 0, 0, 0.8)",
    border: "2px solid #000000",
    borderRadius: "12px",
    padding: theme.spacing(1.2),
    maxWidth: "calc(100vw - 32px)",
    transform: "translateX(0)",
    zIndex: 9999, // Increased z-index to ensure it stays on top
    '@media (max-width: 600px)': {
        top: "8px",
        right: "8px",
        padding: theme.spacing(0.8),
    }
}));

const UserAvatar = styled(Avatar)<{ color: string }>(({ color }) => ({
    backgroundColor: color,
    width: 36,
    height: 36,
    fontSize: "0.9rem",
    border: "2px solid #000000",
    boxShadow: "3px 3px 0px rgba(0, 0, 0, 0.8)",
    transition: "transform 0.2s ease",
    "&:hover": {
        transform: "translate(-2px, -2px)",
        boxShadow: "5px 5px 0px rgba(0, 0, 0, 0.8)",
    }
}));

const PopoverContainer = styled("div")(({ theme }) => ({
    backgroundColor: "#ffffff",
    border: "2px solid #000000",
    boxShadow: "6px 6px 0px rgba(0, 0, 0, 0.8)",
    borderRadius: "10px",
    padding: theme.spacing(2),
    minWidth: "200px",
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 800,
    "& > div": {
        margin: "4px 0",
        padding: "8px",
        borderRadius: "8px",
        backgroundColor: "#f8f9fa",
        border: "1px solid #000000",
        display: "flex",
        alignItems: "center",
        gap: "8px"
    }
}));

const PlusButton = styled(Avatar)(({ theme }) => ({
    backgroundColor: '#ffffff',
    color: '#000000',
    width: 36,
    height: 36,
    fontSize: "0.9rem",
    fontWeight: "bold",
    border: "2px solid #000000",
    boxShadow: "3px 3px 0px rgba(0, 0, 0, 0.8)",
    cursor: "pointer",
    transition: "transform 0.2s ease",
    "&:hover": {
        backgroundColor: "#f0f0f0",
        transform: "translate(-2px, -2px)",
        boxShadow: "5px 5px 0px rgba(0, 0, 0, 0.8)",
    }
}));

const StyledTooltip = styled(
    ({ className, ...props }: TooltipProps) => (
        <Tooltip {...props} classes={{ popper: className }} />
    )
)(() => ({
    '& .MuiTooltip-tooltip': {
        backgroundColor: '#ffffff',
        color: '#000000',
        border: '2px solid #000000',
        boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)',
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '0.875rem',
        fontWeight: '500',
    },
    '& .MuiTooltip-arrow': {
        '&::before': {
            backgroundColor: '#ffffff',
            border: '2px solid #000000',
        },
    },
}));


const ActiveUsers: React.FC<ActiveUsersProps> = ({ users }) => {
    const userList = Object.values(users);
    const maxVisible = 2;
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const remainingCount = userList.length - maxVisible;

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <Container>
            {userList.slice(0, maxVisible).map((user) => (
                <StyledTooltip key={user.id} title={user.name} arrow>
                    <UserAvatar color={user.color}>{user.name.charAt(0)}</UserAvatar>
                </StyledTooltip>
            ))}
            {userList.length > maxVisible && (
                <>
                    <StyledTooltip title={`Show all users`} arrow>
                        <PlusButton onClick={handleOpen}>
                            +{remainingCount}
                        </PlusButton>
                    </StyledTooltip>
                    <Popover
                        open={Boolean(anchorEl)}
                        anchorEl={anchorEl}
                        onClose={handleClose}
                        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                        transformOrigin={{ vertical: "top", horizontal: "left" }}
                        PaperProps={{
                            style: {
                                backgroundColor: "transparent",
                                boxShadow: "none",
                                marginTop: "15px",
                                marginRight: "0px",
                            },
                        }}
                    >
                        <PopoverContainer>
                            {userList.slice(maxVisible).map((user) => (
                                <div key={user.id}>
                                    <UserAvatar color={user.color}>{user.name.charAt(0)}</UserAvatar>
                                    <span>{user.name}</span>
                                </div>
                            ))}
                        </PopoverContainer>
                    </Popover>
                </>
            )}
        </Container>
    );
};

export default ActiveUsers;