import React from 'react';
import { GameSummary } from '../models/GameSummary';

interface DeleteGameModalProps {
  game: GameSummary;
  onDelete: (gameId: string) => void;
}

const DeleteGameModal: React.FC<DeleteGameModalProps> = ({ game, onDelete }) => {
  const modalId = `deleteModal-${game.id}`;

  const handleDelete = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onDelete(game.id);
  };

  return (
    <div className="modal fade game-modal" id={modalId} tabIndex={-1} aria-labelledby={`${modalId}-label`} aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header border-0 pb-0">
            <div className="delete-icon"><i className="bi bi-trash3"></i></div>
            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body pt-3">
            <h1 className="modal-title fs-4 fw-bold" id={`${modalId}-label`}>Delete {game.name}?</h1>
            <p className="mt-2 mb-0" style={{ color: '#9aa6bd' }}>
              This will permanently remove the game from your catalog. This action cannot be undone.
            </p>
          </div>
          <div className="modal-footer">
            <button type="button" className="secondary-action" data-bs-dismiss="modal">Keep game</button>
            <form onSubmit={handleDelete}>
              <button type="submit" className="secondary-action btn-danger-soft" data-bs-dismiss="modal">
                <i className="bi bi-trash3"></i> Delete game
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteGameModal;
