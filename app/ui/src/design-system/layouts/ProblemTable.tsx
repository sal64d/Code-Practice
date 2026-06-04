
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router';
import type { ProblemListItem } from '../../lib/api/problems';

export interface ProblemTableProps {
  problems: ProblemListItem[];
}

export function ProblemTable({ problems }: ProblemTableProps) {
  if (!problems || problems.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">No problems found.</Typography>
        <Typography variant="body2" color="text.secondary">Did you run the seed script?</Typography>
      </Box>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Problem List
      </Typography>
      
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="problem table">
          <TableHead sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Difficulty</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Tags</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Languages</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {problems.map((p) => (
              <TableRow key={p.id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.02)' } }}>
                <TableCell component="th" scope="row">
                  <Link component={RouterLink} to={`/problems/${p.id}`} underline="hover" color="primary.main" sx={{ fontWeight: 500 }}>
                    {p.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={p.difficulty} 
                    color={getDifficultyColor(p.difficulty)} 
                    size="small" 
                    sx={{ textTransform: 'capitalize', fontWeight: 'bold' }} 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {p.tags.map((t) => (
                      <Chip key={t} label={t} size="small" variant="filled" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  {p.supported_languages.join(', ')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
