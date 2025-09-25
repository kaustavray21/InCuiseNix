document.addEventListener('DOMContentLoaded', function() {
    const playerContainer = document.getElementById('player-data-container');
    if (!playerContainer) return;

    const csrfToken = playerContainer.dataset.csrfToken;
    const videoId = playerContainer.dataset.videoId;

    // 1. Initialize the Plyr Player
    const player = new Plyr('#player', {
        // Options can go here if needed
    });

    // --- 2. Logic for the "Add Note" Modal ---
    const addNoteModal = document.getElementById('addNoteModal');
    if (addNoteModal) {
        addNoteModal.addEventListener('show.bs.modal', function (event) {
            player.pause();
            const currentTime = Math.round(player.currentTime);
            const timestampInput = document.getElementById('id_video_timestamp');
            if (timestampInput) {
                timestampInput.value = currentTime;
            }
        });
    }
    
    // --- 3. Logic for the "View Note" Modal ---
    const viewNoteModal = document.getElementById('viewNoteModal');
    if (viewNoteModal) {
        viewNoteModal.addEventListener('show.bs.modal', function(event) {
            const triggerElement = event.relatedTarget;
            const noteContent = triggerElement.getAttribute('data-bs-note-content');
            const noteMeta = triggerElement.getAttribute('data-bs-note-meta');
            const modalBody = viewNoteModal.querySelector('.modal-body p');
            const modalMeta = viewNoteModal.querySelector('#viewNoteModalMeta');
            modalBody.textContent = noteContent;
            modalMeta.textContent = noteMeta;
        });
    }
});