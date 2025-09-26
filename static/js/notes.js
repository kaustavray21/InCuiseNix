document.addEventListener('DOMContentLoaded', function() {
    // --- 1. SETUP & INITIALIZATION ---
    const playerContainer = document.getElementById('player-data-container');
    if (!playerContainer) return;

    const csrfToken = playerContainer.dataset.csrfToken;

    // --- 2. TIMESTAMP FORMATTING ---
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

    // --- 3. "ADD NOTE" FUNCTIONALITY ---
    const addNoteModalEl = document.getElementById('addNoteModal');
    const addNoteModal = bootstrap.Modal.getInstance(addNoteModalEl) || new bootstrap.Modal(addNoteModalEl);
    const addNoteForm = document.getElementById('addNoteForm');
    const notesList = document.getElementById('notes-list-container');
    const noNotesMessage = document.getElementById('no-notes-message');
    
    addNoteModalEl.addEventListener('show.bs.modal', function () {
        // Access the globally available player to pause it
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
                return response.json().then(err => { throw err; });
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
                
                // Access the globally available player to resume it
                if (window.videoPlayer) {
                    window.videoPlayer.play();
                }
            }
        })
        .catch(error => {
            console.error('Error adding note:', error);
            let errorMessage = 'Could not save the note. Please try again.';
            if (error && error.errors) {
                errorMessage += '\n\nDetails:\n';
                for (const field in error.errors) {
                    errorMessage += `- ${error.errors[field][0]}\n`;
                }
            }
            alert(errorMessage);
        });
    });
    
    // --- 4. "VIEW, EDIT, DELETE NOTE" FUNCTIONALITY ---
    const editNoteModalEl = document.getElementById('editNoteModal');
    const editNoteModal = bootstrap.Modal.getInstance(editNoteModalEl) || new bootstrap.Modal(editNoteModalEl);
    const editNoteForm = document.getElementById('editNoteForm');
    const editNoteContent = document.getElementById('editNoteContent');
    const viewNoteModal = document.getElementById('viewNoteModal');
    
    if (viewNoteModal) {
        viewNoteModal.addEventListener('show.bs.modal', function(event) {
            const triggerLink = event.relatedTarget.closest('.note-card-link');
            if (triggerLink) {
                const noteContent = triggerLink.getAttribute('data-bs-note-content');
                const noteMeta = triggerLink.getAttribute('data-bs-note-meta');
                viewNoteModal.querySelector('.modal-body p').textContent = noteContent;
                viewNoteModal.querySelector('#viewNoteModalMeta').innerHTML = noteMeta;
            }
        });
    }
    
    document.body.addEventListener('click', function(event) {
        const target = event.target;
        
        if (target.matches('.btn-edit-note, .btn-edit-note i')) {
            const button = target.closest('.btn-edit-note');
            editNoteContent.value = button.dataset.noteContent;
            editNoteForm.dataset.noteId = button.dataset.noteId;
            editNoteModal.show();
        }
        
        if (target.matches('.btn-delete-note, .btn-delete-note i')) {
            const button = target.closest('.btn-delete-note');
            const noteId = button.dataset.noteId;
            
            if (confirm('Are you sure you want to delete this note?')) {
                fetch(`/note/delete/${noteId}/`, {
                    method: 'POST',
                    headers: { 'X-CSRFToken': csrfToken }
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
        }
    });
    
    editNoteForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const noteId = this.dataset.noteId;
        const newContent = editNoteContent.value;
        
        fetch(`/note/edit/${noteId}/`, {
            method: 'POST',
            headers: { 'X-CSRFToken': csrfToken, 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: newContent })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const noteCardText = document.querySelector(`.note-card[data-note-id='${noteId}'] .card-text`);
                const editButton = document.querySelector(`.btn-edit-note[data-note-id='${noteId}']`);
                const viewLink = document.querySelector(`.note-card[data-note-id='${noteId}'] .note-card-link`);

                if (noteCardText) noteCardText.textContent = newContent;
                if (editButton) editButton.dataset.noteContent = newContent;
                if (viewLink) viewLink.dataset.bsNoteContent = newContent;
                
                editNoteModal.hide();
            } else {
                alert('Error updating note.');
            }
        });
    });

    // --- 5. HELPER FUNCTION ---
    function createNoteCard(note) {
        const safeContent = note.content.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
        return `
            <div class="card mb-2 note-card" data-note-id="${note.id}">
                <div class="card-body position-relative">
                    <a href="#" class="text-decoration-none text-dark note-card-link" data-bs-toggle="modal" data-bs-target="#viewNoteModal" 
                       data-bs-note-content="${safeContent}" 
                       data-bs-note-meta="Timestamp: ${note.timestamp}s &mdash; Added on: ${note.created_at}">
                        <p class="card-text text-truncate">${safeContent}</p>
                        <p class="card-subtitle text-muted small note-timestamp" data-seconds="${note.timestamp}">
                            Timestamp: ${note.timestamp}s
                        </p>
                    </a>
                    <div class="note-actions">
                        <button class="btn btn-sm btn-outline-primary py-0 px-1 btn-edit-note"
                                data-note-id="${note.id}"
                                data-note-content="${safeContent}">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger py-0 px-1 btn-delete-note"
                                data-note-id="${note.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
});