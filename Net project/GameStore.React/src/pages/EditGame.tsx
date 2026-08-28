import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import GamesClient from '../clients/GamesClient';
import GenresClient from '../clients/GenresClient';
import { GameDetails } from '../models/GameDetails';
import { Genre } from '../models/Genre';

const EditGame: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [game, setGame] = useState<GameDetails | null>(null);
    const [genres, setGenres] = useState<Genre[] | null>(null);
    const [title, setTitle] = useState<string>('');
    const [loadingErrorList, setLoadingErrorList] = useState<string[]>([]);
    const [errorList, setErrorList] = useState<string[]>([]);
    const genresClient = new GenresClient();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const gamesClient = new GamesClient();

                if (id) {
                    const gameData = await gamesClient.getGameAsync(id);
                    setGame(gameData);
                    setTitle(`Edit ${gameData.name}`);
                    document.title = `Edit ${gameData.name} | GameStore`;
                } else {
                    setGame({
                        id: '',
                        name: '',
                        genreId: null,
                        price: 0,
                        releaseDate: new Date().toISOString().split('T')[0],
                        description: '',
                        imageUri: null,
                    });
                    setTitle('Add a new game');
                    document.title = 'Add Game | GameStore';
                }

                const genresData = await genresClient.getGenresAsync();
                setGenres(genresData);
            } catch (error: unknown) {
                if (error instanceof Error) {
                    setLoadingErrorList([error.message]);
                } else {
                    setLoadingErrorList(['An unknown error occurred']);
                }
            }
        };
        fetchData();
    }, [id]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!game) return;

        setErrorList([]);
        const gamesClient = new GamesClient();

        const result = !id
            ? await gamesClient.addGameAsync(game)
            : await gamesClient.updateGameAsync({ ...game, id });

        if (result.succeeded) {
            navigate('/');
        } else {
            setErrorList(result.errors);
        }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = event.target;
        setGame((prevGame) => ({
            ...prevGame!,
            [name]: name === 'price' ? parseFloat(value || '0') : value,
        }));
    };

    if (loadingErrorList.length > 0) {
        return (
            <div className="state-panel mt-4">
                <div className="state-icon"><i className="bi bi-exclamation-triangle"></i></div>
                <h4 className="text-white">Could not load this page</h4>
                {loadingErrorList.map((error, index) => <p key={index}>{error}</p>)}
                <Link className="secondary-action mt-2" to="/"><i className="bi bi-arrow-left"></i> Back to library</Link>
            </div>
        );
    }

    if (!genres || !game) {
        return (
            <div className="state-panel mt-4">
                <div className="loading-ring"></div>
                <h5 className="text-white">Preparing game editor</h5>
                <p className="mb-0">Loading game details and genres...</p>
            </div>
        );
    }

    const selectedGenre = genres.find(genre => String(genre.id) === String(game.genreId));

    return (
        <div>
            <Link className="back-link" to="/"><i className="bi bi-arrow-left"></i> Back to game library</Link>

            <div className="page-heading">
                <span className="eyebrow"><i className={`bi ${id ? 'bi-pencil-square' : 'bi-plus-circle'}`}></i> Game editor</span>
                <h1 className="hero-title" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}>{title}</h1>
                <p className="hero-copy">{id ? 'Update the details below and save your changes.' : 'Enter a few details to add a new title to your collection.'}</p>
            </div>

            {errorList.length > 0 && (
                <div className="custom-alert p-3 mb-4">
                    {errorList.map((error, index) => <div key={index}><i className="bi bi-exclamation-circle me-2"></i>{error}</div>)}
                </div>
            )}

            <div className="row g-4 align-items-start">
                <div className="col-lg-7">
                    <div className="form-panel">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label htmlFor="name" className="form-label">Game name</label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={game.name}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="e.g. The Legend of Zelda"
                                    required
                                />
                                <div className="form-hint">Use the title players would recognize.</div>
                            </div>

                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label htmlFor="genre" className="form-label">Genre</label>
                                    <select
                                        id="genre"
                                        name="genreId"
                                        value={game.genreId || ''}
                                        onChange={handleInputChange}
                                        className="form-select"
                                        required
                                    >
                                        <option value="">Select a genre</option>
                                        {genres.map((genre) => (
                                            <option key={genre.id} value={genre.id}>{genre.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-6">
                                    <label htmlFor="price" className="form-label">Price</label>
                                    <div className="input-group">
                                        <span className="input-group-text">$</span>
                                        <input
                                            id="price"
                                            name="price"
                                            type="number"
                                            value={game.price}
                                            onChange={handleInputChange}
                                            className="form-control"
                                            required
                                            min="0"
                                            max="100"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 mb-4">
                                <label htmlFor="releaseDate" className="form-label">Release date</label>
                                <input
                                    id="releaseDate"
                                    name="releaseDate"
                                    type="date"
                                    value={game.releaseDate}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    required
                                />
                            </div>

                            <div className="d-flex flex-wrap gap-2 pt-2">
                                <button type="submit" className="primary-action">
                                    <i className="bi bi-check2-circle"></i> {id ? 'Save changes' : 'Add game'}
                                </button>
                                <button type="button" className="secondary-action" onClick={() => navigate('/')}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="col-lg-5">
                    <aside className="preview-panel">
                        <div className="preview-cover">
                            <i className="bi bi-controller preview-controller"></i>
                        </div>
                        <div className="preview-content">
                            <div className="preview-label">Live preview</div>
                            <h3 className="preview-title">{game.name || 'Untitled Game'}</h3>
                            <div className="d-flex align-items-center justify-content-between mt-3 gap-3">
                                <span className="genre-badge position-static">{selectedGenre?.name || 'Choose genre'}</span>
                                <strong className="fs-5">${Number(game.price || 0).toFixed(2)}</strong>
                            </div>
                            <div className="game-meta mt-3">
                                <i className="bi bi-calendar3"></i>
                                <span>{game.releaseDate || 'No release date'}</span>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default EditGame;
