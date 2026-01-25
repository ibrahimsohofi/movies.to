import { toast } from 'sonner';

export const exportToCSV = (movies) => {
  if (!movies || movies.length === 0) {
    toast.error('No movies to export');
    return;
  }

  try {
    // CSV Header
    const headers = ['Title', 'Year', 'Rating', 'Genres', 'TMDB ID', 'Runtime', 'Date Added'];

    // CSV Rows
    const rows = movies.map((movie) => {
      const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
      const rating = movie.vote_average?.toFixed(1) || 'N/A';
      const genres = movie.genres?.map((g) => g.name).join('; ') || 'N/A';
      const runtime = movie.runtime ? `${movie.runtime} min` : 'N/A';
      const dateAdded = movie.addedAt
        ? new Date(movie.addedAt).toLocaleDateString()
        : new Date().toLocaleDateString();

      return [
        `"${movie.title.replace(/"/g, '""')}"`,
        year,
        rating,
        `"${genres}"`,
        movie.id,
        runtime,
        dateAdded,
      ].join(',');
    });

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `movies-watchlist-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${movies.length} movies to CSV`);
  } catch (error) {
    console.error('CSV export failed:', error);
    toast.error('Failed to export CSV');
  }
};

export const exportToJSON = (movies) => {
  if (!movies || movies.length === 0) {
    toast.error('No movies to export');
    return;
  }

  try {
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      totalMovies: movies.length,
      movies: movies.map((movie) => ({
        id: movie.id,
        title: movie.title,
        releaseDate: movie.release_date,
        rating: movie.vote_average,
        voteCount: movie.vote_count,
        overview: movie.overview,
        posterPath: movie.poster_path,
        backdropPath: movie.backdrop_path,
        genres: movie.genres,
        runtime: movie.runtime,
        tagline: movie.tagline,
        addedAt: movie.addedAt || new Date().toISOString(),
      })),
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `movies-watchlist-${Date.now()}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${movies.length} movies to JSON`);
  } catch (error) {
    console.error('JSON export failed:', error);
    toast.error('Failed to export JSON');
  }
};

export const importFromJSON = async (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      reject(new Error('Invalid file type. Please select a JSON file.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const data = JSON.parse(content);

        if (!data.movies || !Array.isArray(data.movies)) {
          reject(new Error('Invalid JSON format. Missing movies array.'));
          return;
        }

        toast.success(`Imported ${data.movies.length} movies`);
        resolve(data.movies);
      } catch (error) {
        console.error('JSON import failed:', error);
        reject(new Error('Failed to parse JSON file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};

export const exportToPDF = async (movies) => {
  if (!movies || movies.length === 0) {
    toast.error('No movies to export');
    return;
  }

  try {
    // Dynamic import to reduce bundle size
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('My Movie Watchlist', pageWidth / 2, 20, { align: 'center' });

    // Subtitle
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(
      `Exported on ${new Date().toLocaleDateString()} • ${movies.length} movies`,
      pageWidth / 2,
      28,
      { align: 'center' }
    );

    // Prepare table data
    const tableData = movies.map((movie) => {
      const year = movie.release_date
        ? new Date(movie.release_date).getFullYear()
        : 'N/A';
      const rating = movie.vote_average?.toFixed(1) || 'N/A';
      const genres = movie.genres?.map((g) => g.name).join(', ') || 'N/A';
      const runtime = movie.runtime ? `${movie.runtime} min` : 'N/A';

      return [movie.title, year, rating, genres, runtime];
    });

    // Create table
    autoTable(doc, {
      startY: 35,
      head: [['Title', 'Year', 'Rating', 'Genres', 'Runtime']],
      body: tableData,
      theme: 'striped',
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [15, 23, 42], // slate-900
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // slate-50
      },
      columnStyles: {
        0: { cellWidth: 60 }, // Title
        1: { cellWidth: 20, halign: 'center' }, // Year
        2: { cellWidth: 20, halign: 'center' }, // Rating
        3: { cellWidth: 50 }, // Genres
        4: { cellWidth: 25, halign: 'center' }, // Runtime
      },
      margin: { top: 35, left: 14, right: 14 },
    });

    // Footer on last page
    const pageCount = doc.internal.pages.length - 1;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Page ${i} of ${pageCount} • Generated by Movies.to`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Save PDF
    doc.save(`movies-watchlist-${Date.now()}.pdf`);
    toast.success(`Exported ${movies.length} movies to PDF`);
  } catch (error) {
    console.error('PDF export failed:', error);
    toast.error('Failed to export PDF');
  }
};
