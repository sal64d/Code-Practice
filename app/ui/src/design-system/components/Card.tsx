import MuiCard, { type CardProps as MuiCardProps } from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

export interface CardProps extends MuiCardProps {
  children: React.ReactNode;
  noPadding?: boolean;
}

export function Card({ children, noPadding = false, sx, ...props }: CardProps) {
  return (
    <MuiCard sx={sx} {...props}>
      {noPadding ? children : <CardContent>{children}</CardContent>}
    </MuiCard>
  );
}
