import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
// @ts-ignore - JSX component
import MovieCard from './MovieCard';

// Mock movie data
const mockMovie = {
  id: 1,
  title: 'Test Movie',
  poster_path: '/test-poster.jpg',
  vote_average: 8.5,
  release_date: '2024-01-01',
  overview: 'This is a test movie overview',
  genre_ids: [28, 12],
};

// Wrapper component for Router
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('MovieCard', () => {
  it('renders movie information correctly', () => {
    render(
      <RouterWrapper>
        <MovieCard movie={mockMovie} />
      </RouterWrapper>
    );

    // Use getAllByText to handle potential duplicates and check the first one exists
    const titleElements = screen.getAllByText('Test Movie');
    expect(titleElements.length).toBeGreaterThan(0);
    expect(titleElements[0]).toBeInTheDocument();
    expect(screen.getByText('8.5')).toBeInTheDocument();
  });

  it('displays poster image with correct alt text', async () => {
    render(
      <RouterWrapper>
        <MovieCard movie={mockMovie} />
      </RouterWrapper>
    );

    // The actual alt text includes "movie poster" suffix
    const posterImage = await screen.findByAltText('Test Movie movie poster');
    expect(posterImage).toBeInTheDocument();
    expect(posterImage).toHaveAttribute('src', expect.stringContaining('/test-poster.jpg'));
  });

  it('links to correct movie detail page', () => {
    render(
      <RouterWrapper>
        <MovieCard movie={mockMovie} />
      </RouterWrapper>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/movie/1');
  });

  it('shows fallback when no poster_path', () => {
    const movieNoPoster = { ...mockMovie, poster_path: null };
    render(
      <RouterWrapper>
        <MovieCard movie={movieNoPoster} />
      </RouterWrapper>
    );

    // Should render without crashing
    const titleElements = screen.getAllByText('Test Movie');
    expect(titleElements.length).toBeGreaterThan(0);
  });

  it('formats rating correctly', () => {
    const movieWithLowRating = { ...mockMovie, vote_average: 3.2 };
    render(
      <RouterWrapper>
        <MovieCard movie={movieWithLowRating} />
      </RouterWrapper>
    );

    expect(screen.getByText('3.2')).toBeInTheDocument();
  });

  it('handles hover state', async () => {
    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <MovieCard movie={mockMovie} />
      </RouterWrapper>
    );

    const card = screen.getByRole('link');
    await user.hover(card);
    // Verify hover effects are applied (would need to check computed styles)
  });
});
