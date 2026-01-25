import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
// @ts-ignore - JSX component
import SearchAutocomplete from './SearchAutocomplete';

// Mock the API module
vi.mock('@/services/tmdb', () => ({
  default: {
    searchMovies: vi.fn(() =>
      Promise.resolve({
        results: [
          { id: 1, title: 'The Dark Knight', poster_path: '/poster1.jpg' },
          { id: 2, title: 'The Dark Knight Rises', poster_path: '/poster2.jpg' },
        ],
      })
    ),
  },
  tmdbAPI: {
    searchMovies: vi.fn(() =>
      Promise.resolve({
        results: [
          { id: 1, title: 'The Dark Knight', poster_path: '/poster1.jpg' },
          { id: 2, title: 'The Dark Knight Rises', poster_path: '/poster2.jpg' },
        ],
      })
    ),
    getTrendingMovies: vi.fn(),
    getPopularMovies: vi.fn(),
    getTopRatedMovies: vi.fn(),
    getUpcomingMovies: vi.fn(),
  },
  searchMovies: vi.fn(() =>
    Promise.resolve({
      results: [
        { id: 1, title: 'The Dark Knight', poster_path: '/poster1.jpg' },
        { id: 2, title: 'The Dark Knight Rises', poster_path: '/poster2.jpg' },
      ],
    })
  ),
  getImageUrl: vi.fn((path) => `https://image.tmdb.org/t/p/w500${path}`),
}));

const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('SearchAutocomplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input', () => {
    render(
      <RouterWrapper>
        <SearchAutocomplete />
      </RouterWrapper>
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('shows suggestions when typing', async () => {
    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <SearchAutocomplete />
      </RouterWrapper>
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'dark knight');

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });
  });

  it('debounces search input', async () => {
    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <SearchAutocomplete />
      </RouterWrapper>
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'd');

    // Should not show results immediately
    expect(screen.queryByText('The Dark Knight')).not.toBeInTheDocument();

    // Wait for debounce
    await waitFor(
      () => {
        expect(screen.queryByText('The Dark Knight')).toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });

  it('clears results when input is cleared', async () => {
    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <SearchAutocomplete />
      </RouterWrapper>
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'dark knight');

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });

    await user.clear(searchInput);

    await waitFor(() => {
      expect(screen.queryByText('The Dark Knight')).not.toBeInTheDocument();
    });
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <SearchAutocomplete />
      </RouterWrapper>
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'dark knight');

    await waitFor(() => {
      expect(screen.getByText('The Dark Knight')).toBeInTheDocument();
    });

    // Test arrow key navigation
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowUp}');
    await user.keyboard('{Enter}');

    // Should navigate to movie detail page
  });
});
