document.addEventListener('DOMContentLoaded', function() {
    const playerContainer = document.getElementById('player-data-container');
    if (!playerContainer) return;
    const csrfToken = playerContainer.dataset.csrfToken;

    function formatTimestamp(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const paddedSeconds = seconds.toString().padStart(2, '0');
        return `${minutes}:${paddedSeconds}`;
    }

    function formatAllTimestamps() {
        document.querySelectorAll('.note-timestamp').forEach(el => {
            const seconds = parseInt(el.dataset.seconds, 10);
            if (!isNaN(seconds)) {
                el.textContent = `Timestamp: ${formatTimestamp(seconds)}`;
            }
        });
    }
    formatAllTimestamps();

    const addNoteModalEl = document.getElementById('addNoteModal');
    const addNoteModal = new bootstrap.Modal(addNoteModalEl);
    const addNoteForm = document.getElementById('addNoteForm');
    const editNoteModalEl = document.getElementById('editNoteModal');
    const editNoteModal = new bootstrap.Modal(editNoteModalEl);
    const editNoteForm = document.getElementById('editNoteForm');
    const editNoteContent = document.getElementById('editNoteContent');
    const notesList = document.getElementById('notes-list-container');
    const noNotesMessage = document.getElementById('no-notes-message');

    addNoteModalEl.addEventListener('show.bs.modal', function() {
        if (window.videoPlayer) {
            window.videoPlayer.pause();
            const currentTime = Math.round(window.videoPlayer.currentTime);
            const timestampInput = addNoteForm.querySelector('input[name="video_timestamp"]');
            if (timestampInput) {
                timestampInput.value = currentTime;
            }
        }
    });

    addNoteForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const videoId = this.dataset.videoId;
        const formData = new FormData(this);

        fetch(`/note/add/${videoId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken
                },
                body: formData,
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw err;
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    if (noNotesMessage) noNotesMessage.style.display = 'none';

                    const newNoteCardHTML = createNoteCard(data.note);
                    notesList.insertAdjacentHTML('afterbegin', newNoteCardHTML);

                    formatAllTimestamps();
                    addNoteForm.reset();
                    addNoteModal.hide();

                    if (window.videoPlayer) {
                        window.videoPlayer.play();
                    }
                }
            })
            .catch(error => {
                console.error('Error adding note:', error);
            });
    });

    editNoteForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const noteId = this.dataset.noteId;
        const newContent = editNoteContent.value;

        fetch(`/note/edit/${noteId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: newContent
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    const noteCard = document.querySelector(`.note-card[data-note-id='${noteId}']`);
                    if (noteCard) {
                        noteCard.querySelector('.card-text').textContent = newContent;
                        noteCard.dataset.fullContent = newContent; 
                    }
                    
                    const editButton = document.querySelector(`.btn-edit-note[data-note-id='${noteId}']`);
                    if (editButton) editButton.dataset.noteContent = newContent;

                    editNoteModal.hide();
                } else {
                    alert('Error updating note.');
                }
            });
    });

    const notePopupOverlay = document.getElementById('note-popup-overlay');
    const popupNoteContent = document.getElementById('popup-note-content');
    const popupNoteMeta = document.getElementById('popup-note-meta');
    const popupCloseBtn = document.getElementById('popup-close-btn');

    notesList.addEventListener('click', function(event) {
        const target = event.target;
        const noteCard = target.closest('.note-card');

        if (target.closest('.btn-edit-note')) {
            const button = target.closest('.btn-edit-note');
            editNoteContent.value = button.dataset.noteContent;
            editNoteForm.dataset.noteId = button.dataset.noteId;
            editNoteModal.show();
            return;
        }

        if (target.closest('.btn-delete-note')) {
            const button = target.closest('.btn-delete-note');
            const noteId = button.dataset.noteId;

            if (confirm('Are you sure you want to delete this note?')) {
                fetch(`/note/delete/${noteId}/`, {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': csrfToken
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === 'success') {
                            document.querySelector(`.note-card[data-note-id='${noteId}']`).remove();
                        } else {
                            alert('Error deleting note.');
                        }
                    });
            }
            return;
        }

        if (noteCard) {
            const noteContent = noteCard.dataset.fullContent;
            const noteMeta = noteCard.dataset.metaInfo;

            popupNoteContent.textContent = noteContent;
            popupNoteMeta.innerHTML = noteMeta;
            notePopupOverlay.style.display = 'flex';
        }
    });

    function closePopup() {
        notePopupOverlay.style.display = 'none';
    }

    popupCloseBtn.addEventListener('click', closePopup);
    notePopupOverlay.addEventListener('click', function(event) {
        if (event.target === notePopupOverlay) {
            closePopup();
        }
    });

    function createNoteCard(note) {
        const safeContent = note.content.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
        return `
            <div class="card mb-3 note-card" 
                 data-note-id="${note.id}"
                 data-full-content="${safeContent}"
                 data-meta-info="Timestamp: ${note.timestamp}s &mdash; Added on: ${note.created_at}">
                <div class="card-body">
                    <div class="note-status-indicator"></div>
                    <div class="note-text-wrapper">
                        <p class="card-text text-truncate">${safeContent}</p>
                        <p class="note-timestamp" data-seconds="${note.timestamp}">
                            Timestamp: ${note.timestamp}s
                        </p>
                    </div>
                    <div class="note-actions">
                        <button class="note-btn note-btn-edit btn-edit-note"
                                data-note-id="${note.id}"
                                data-note-content="${safeContent}">
                            Edit <i class="fas fa-pen-to-square ms-1"></i>
                        </button>
                        <button class="note-btn note-btn-delete btn-delete-note"
                                data-note-id="${note.id}">
                            <i class="fas fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
});

