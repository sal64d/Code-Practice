import { type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { Button } from '../components/Button';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SendIcon from '@mui/icons-material/Send';
import Chip from '@mui/material/Chip';

export interface ProblemPageLayoutProps {
  title: string;
  difficulty: string;
  versionNumber: number;
  mdxContent: ReactNode;
  editor: ReactNode;
  results: ReactNode;
  onRun: () => void;
  onSubmit: () => void;
  isRunning: boolean;
  isSubmitting: boolean;
  submitError: string;
}

export function ProblemPageLayout({
  title,
  difficulty,
  versionNumber,
  mdxContent,
  editor,
  results,
  onRun,
  onSubmit,
  isRunning,
  isSubmitting,
  submitError,
}: ProblemPageLayoutProps) {
  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden', bgcolor: 'background.default' }}>
      {/* Left Pane: MDX */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: 1, borderColor: 'divider' }}>
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }} gutterBottom>
            {title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip 
              label={difficulty} 
              color={getDifficultyColor(difficulty)} 
              size="small" 
              sx={{ textTransform: 'capitalize', fontWeight: 'bold' }} 
              variant="outlined"
            />
            <Typography variant="caption" color="text.secondary">
              Version: {versionNumber}
            </Typography>
          </Box>
        </Box>
        <Box className="mdx-content" sx={{ flex: 1, p: 3, overflowY: 'auto', lineHeight: 1.6, '& pre': { bgcolor: 'background.paper', p: 2, borderRadius: 1, overflowX: 'auto' }, '& code': { bgcolor: 'background.paper', px: 1, py: 0.5, borderRadius: 1 } }}>
          {mdxContent}
        </Box>
      </Box>

      {/* Right Pane: Editor & Runner */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'rgba(255, 255, 255, 0.02)', display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button 
            onClick={onRun} 
            disabled={isRunning}
            isLoading={isRunning}
            startIcon={<PlayArrowIcon />}
            variant="contained"
            color="primary"
            size="small"
          >
            Run Tests
          </Button>
          
          <Button 
            onClick={onSubmit} 
            disabled={isSubmitting}
            isLoading={isSubmitting}
            startIcon={<SendIcon />}
            variant="contained"
            color="success"
            size="small"
          >
            Submit
          </Button>
          
          {submitError && (
            <Typography variant="body2" color="error" sx={{ ml: 2, alignSelf: 'center' }}>
              {submitError}
            </Typography>
          )}
        </Box>
        
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          {editor}
        </Box>
        
        <Divider />
        
        <Box sx={{ height: '40%', minHeight: 200, overflow: 'hidden', bgcolor: 'background.paper' }}>
          {results}
        </Box>
      </Box>
    </Box>
  );
}
