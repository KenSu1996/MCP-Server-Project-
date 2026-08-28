import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import GamesClient from '../clients/GamesClient';
import { GameSummary } from '../models/GameSummary';
import DeleteGameModal from '../components/DeleteGameModal';

declare global {
    interface Window {
        bootstrap: any;
    }
}

const Home: React.FC = () => {
    const [games, setGames] = useState<GameSummary[]>([]);
    const [loadingErrorList, setLoadingErrorList] = useState<string[]>([]);
    const [errorList, setErrorList] = useState<string[]>([]);
    const [gameToDelete, setGameToDelete] = useState<GameSummary | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState('');
    const client = new GamesClient();

    const fetchGames = async () => {
        try {
            setIsLoading(true);
            const response = await client.getGamesAsync();
            setGames(response);
            setLoadingErrorList([]);
        } catch (error: unknown) {
            if (error instanceof Error) {
                setLoadingErrorList([error.message]);
            } else {
                setLoadingErrorList(['An unknown error occurred']);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        document.title = 'GameStore | Game Library';
        fetchGames();
    }, []);

    useEffect(() => {
        if (gameToDelete) {
            const modalElement = document.getElementById(`deleteModal-${gameToDelete.id}`)!;
            const modal = new window.bootstrap.Modal(modalElement);

            const handleModalHide = () => setGameToDelete(null);
            modalElement.addEventListener('hidden.bs.modal', handleModalHide);
            modal.show();

            return () => modalElement.removeEventListener('hidden.bs.modal', handleModalHide);
        }
    }, [gameToDelete]);

    const handleDelete = async (gameId: string) => {
        setErrorList([]);
        try {
            const result = await client.deleteGameAsync(gameId);
            if (result.succeeded) {
                setGameToDelete(null);
                fetchGames();
            } else {
                setErrorList(result.errors);
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                setErrorList([error.message]);
            } else {
                setErrorList(['An unknown error occurred']);
            }
        }
    };

    const filteredGames = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return games;
        return games.filter(game =>
            game.name.toLowerCase().includes(query) ||
            game.genre.toLowerCase().includes(query)
        );
    }, [games, searchTerm]);

    const genreCount = useMemo(
        () => new Set(games.map(game => game.genre)).size,
        [games]
    );

    const averagePrice = useMemo(() => {
        if (games.length === 0) return 0;
        return games.reduce((sum, game) => sum + Number(game.price), 0) / games.length;
    }, [games]);

    if (isLoading) {
        return (
            <div className="state-panel mt-4">
                <div className="loading-ring"></div>
                <h5 className="text-white">Loading your library</h5>
                <p className="mb-0">Fetching games from the ASP.NET Core API...</p>
            </div>
        );
    }

    if (loadingErrorList.length > 0) {
        return (
            <div>
                <section className="hero-panel">
                    <span className="eyebrow"><i className="bi bi-controller"></i> Game catalog</span>
                    <h1 className="hero-title">Build your <span className="gradient-text">game library.</span></h1>
                    <p className="hero-copy">Add, organize, edit, and manage your catalog from one clean dashboard.</p>
                    <div className="mt-4">
                        <Link className="primary-action" to="/editgame"><i className="bi bi-plus-lg"></i> New Game</Link>
                    </div>
                </section>
                <div className="custom-alert p-3 mt-4">
                    {loadingErrorList.map((error, index) => (
                        <div key={index}><i className="bi bi-exclamation-triangle me-2"></i>Error loading games: {error}</div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <section className="hero-panel">
                <div className="row align-items-end gy-4 position-relative" style={{ zIndex: 1 }}>
                    <div className="col-lg-8">
                        <span className="eyebrow"><i className="bi bi-stars"></i> Personal game catalog</span>
                        <h1 className="hero-title">Your games. <span className="gradient-text">One library.</span></h1>
                        <p className="hero-copy">
                            Keep your collection organized, discover what you own, and manage every title from a fast full-stack dashboard.
                        </p>
                    </div>
                    <div className="col-lg-4 text-lg-end">
                        <Link className="primary-action" to="/editgame">
                            <i className="bi bi-plus-lg"></i> Add a new game
                        </Link>
                    </div>
                </div>

                <div className="row g-3 stats-row position-relative" style={{ zIndex: 1 }}>
                    <div className="col-6 col-md-4">
                        <div className="stat-card">
                            <div className="stat-label">Games</div>
                            <div className="stat-value">{games.length}</div>
                        </div>
                    </div>
                    <div className="col-6 col-md-4">
                        <div className="stat-card">
                            <div className="stat-label">Genres</div>
                            <div className="stat-value">{genreCount}</div>
                        </div>
                    </div>
                    <div className="col-12 col-md-4">
                        <div className="stat-card">
                            <div className="stat-label">Average price</div>
                            <div className="stat-value">${averagePrice.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            </section>

            {errorList.length > 0 && (
                <div className="custom-alert p-3 mt-4">
                    {errorList.map((error, index) => <div key={index}>{error}</div>)}
                </div>
            )}

            <div className="catalog-toolbar">
                <div>
                    <h2 className="section-title">Game Library</h2>
                    <p className="section-subtitle">{filteredGames.length} {filteredGames.length === 1 ? 'title' : 'titles'} showing</p>
                </div>
                <div className="search-box">
                    <i className="bi bi-search"></i>
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search games or genres..."
                        aria-label="Search games"
                    />
                </div>
            </div>

            {games.length === 0 ? (
                <div className="state-panel">
                    <div className="state-icon"><i className="bi bi-controller"></i></div>
                    <h4 className="text-white">Your library is empty</h4>
                    <p>Add your first game and it will appear here.</p>
                    <Link className="primary-action mt-2" to="/editgame"><i className="bi bi-plus-lg"></i> Add first game</Link>
                </div>
            ) : filteredGames.length === 0 ? (
                <div className="state-panel">
                    <div className="state-icon"><i className="bi bi-search"></i></div>
                    <h4 className="text-white">No matching games</h4>
                    <p className="mb-0">Try another game name or genre.</p>
                </div>
            ) : (
                <div className="row g-4">
                    {filteredGames.map((game) => (
                        <div className="col-sm-6 col-lg-4 col-xl-3" key={game.id}>
                            <article className="game-card">
                                <div className="game-cover">
                                    <span className="genre-badge">{game.genre}</span>
                                    <span className="game-initial">{game.name.charAt(0).toUpperCase()}</span>
                                </div>
                                <div className="game-card-body">
                                    <h3 className="game-name text-truncate" title={game.name}>{game.name}</h3>
                                    <div className="game-meta">
                                        <i className="bi bi-calendar3"></i>
                                        <span>{game.releaseDate}</span>
                                    </div>
                                    <div className="game-price">${Number(game.price).toFixed(2)} <small>CAD</small></div>
                                    <div className="card-actions">
                                        <Link className="icon-action" to={`/editgame/${game.id}`} title={`Edit ${game.name}`}>
                                            <i className="bi bi-pencil-square me-2"></i> Edit
                                        </Link>
                                        <button className="icon-action danger" onClick={() => setGameToDelete(game)} title={`Delete ${game.name}`}>
                                            <i className="bi bi-trash3"></i>
                                        </button>
                                    </div>
                                </div>
                            </article>
                        </div>
                    ))}
                </div>
            )}

            {gameToDelete && <DeleteGameModal game={gameToDelete} onDelete={handleDelete} />}
        </div>
    );
};

export default Home;
