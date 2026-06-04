
import { type TextFieldProps } from '@mui/material/TextField';
import TextField from '@mui/material/TextField';

export type InputProps = TextFieldProps;

export function Input(props: InputProps) {
  return (
    <TextField
      variant="outlined"
      fullWidth
      {...props}
    />
  );
}
