import MuiButton, { type ButtonProps as MuiButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

export interface ButtonProps extends MuiButtonProps {
  isLoading?: boolean;
}

export function Button({ isLoading, disabled, children, ...props }: ButtonProps) {
  return (
    <MuiButton
      disabled={isLoading || disabled}
      {...props}
      startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : props.startIcon}
    >
      {children}
    </MuiButton>
  );
}
