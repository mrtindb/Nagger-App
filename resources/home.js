

//Variable used to temporary store ID of selected Nagger
var currentNaggerId;
document.addEventListener('DOMContentLoaded', function () {
    let setupAlert = document.getElementById('setupAlert');

    //Check if a service worker is already registered
    if ('serviceWorker' in navigator) {
        let isRegistered = false;
        navigator.serviceWorker.getRegistrations().then(function (registrations) {

            for (let registration of registrations) {

                if (registration && registration.active && registration.active.scriptURL === 'https://localhost:3000/service-worker.js') {
                    isRegistered = true;

                    break;
                }
            }
            if (!isRegistered) {
                setupAlert.classList.remove('d-none');
                setupAlert.classList.add('d-flex');
            }
        })
    }

    currentNaggerId = -1;

    var addModal = document.getElementById('addModal');
    var editModal = document.getElementById('editModal');

    // Function to be called when the modal is closed
    function onModalClosed() {
        document.getElementById('addForm').reset();
        document.getElementById('editForm').reset();
    }

    // Attach event listener for the modal 'hidden.bs.modal' event
    addModal.addEventListener('hidden.bs.modal', function () {
        onModalClosed();
    });

    editModal.addEventListener('hidden.bs.modal', function () {
        onModalClosed();
    });

    //Event for the Nagger click
    document.getElementById('editModal').addEventListener('show.bs.modal', function (event) {
        var button = event.relatedTarget;
        currentNaggerId = button.getAttribute('data-bs-naggerId');
        var title = button.getAttribute('data-bs-naggerTitle');
        var description = button.getAttribute('data-bs-naggerDescription');
        var severity = button.getAttribute('data-bs-severity');
        document.getElementById('titleTextBoxEdit').value = title;
        document.getElementById('descriptionTextAreaEdit').value = description;
        document.getElementById('severityDropdownEdit').value = severity;
    })

});

function addNewNagger() {
    let title = document.getElementById('titleTextBoxAdd').value;
    let description = document.getElementById('descriptionTextAreaAdd').value;
    const severity = document.getElementById('severityDropdownAdd').value;

    let now = new Date();
    let year = now.getFullYear();
    let month = String(now.getMonth() + 1).padStart(2, '0');
    let day = String(now.getDate()).padStart(2, '0');
    let hours = String(now.getHours()).padStart(2, '0');
    let minutes = String(now.getMinutes()).padStart(2, '0');
    let formattedDate = `${day}-${month}-${year} ${hours}:${minutes}`;

    if (title === '') title = 'No title';
    if (description === '') description = 'No description';

    let nagger = {
        title: title,
        description: description,
        severity: severity || 1,
        naggerDate: formattedDate
    };
    fetch('/addNagger', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(nagger)
    }).then(response => response.json()).then(data => {

        let card = document.createElement('div');
        card.classList.add('col', 'd-flex', 'align-items-stretch', 'card-item-column');
        card.setAttribute('data-bs-toggle', 'modal');
        card.setAttribute('data-bs-target', '#editModal');
        card.setAttribute('data-bs-naggerId', data.newNaggerId);
        card.setAttribute('data-bs-naggerTitle', title);
        card.setAttribute('data-bs-naggerDescription', description);
        card.setAttribute('data-bs-naggerDate', formattedDate);
        card.setAttribute('data-bs-severity', severity);

        let cardContent = document.createElement('div');
        cardContent.classList.add('text-bg-success', 'shadow', 'card', 'flex-grow-1');

        let cardHeader = document.createElement('div');
        cardHeader.classList.add('card-header');
        cardHeader.textContent = title;

        let cardBody = document.createElement('div');
        cardBody.classList.add('card-body', 'px-2');
        cardBody.textContent = description;

        let cardFooter = document.createElement('div');
        cardFooter.classList.add('card-footer', 'mt-auto');
        cardFooter.textContent = formattedDate;

        cardContent.appendChild(cardHeader);
        cardContent.appendChild(cardBody);
        cardContent.appendChild(cardFooter);

        card.appendChild(cardContent);

        let row = document.getElementById('row');
        row.insertBefore(card, row.lastElementChild);

    }).catch((error) => {
        console.error('Error:', error);
    });


}

function deleteNagger() {
    if (currentNaggerId === -1) {
        return;
    }
    fetch(`/deleteNagger/${currentNaggerId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        if (response.ok) {
            let card = document.querySelector(`[data-bs-naggerId="${currentNaggerId}"]`);
            card.remove();
        }
    }).catch((error) => {
        console.error('Error:', error);
    });
}

function alterNagger() {
    if (currentNaggerId === -1) {
        return;
    }
    let title = document.getElementById('titleTextBoxEdit').value;
    let description = document.getElementById('descriptionTextAreaEdit').value;
    const severity = document.getElementById('severityDropdownEdit').value;
    if (title === '') title = 'No title';
    if (description === '') description = 'No description';


    fetch(`/alterNagger/${currentNaggerId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: title,
            description: description,
            severity: severity
        })
    }).then(response => {
        if (response.ok) {
            const card = document.querySelector(`[data-bs-naggerId="${currentNaggerId}"]`);
            const cardHeader = card.querySelector('.card-header');
            const cardBody = card.querySelector('.card-body');

            cardHeader.textContent = title;
            cardBody.textContent = description;

            card.setAttribute('data-bs-naggerTitle', title);
            card.setAttribute('data-bs-naggerDescription', description);
            card.setAttribute('data-bs-severity', severity);
        }
    }).catch((error) => {
        console.error('Error:', error);
    });
}



