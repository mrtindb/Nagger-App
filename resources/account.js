
export async function changePassword(){
    let passwordOld = document.getElementById('passwordOld').value;
    let passwordNew = document.getElementById('passwordNew').value;
    let passwordNewRepeat = document.getElementById('passwordConf').value;
    if(passwordNew !== passwordNewRepeat){
        displayErrorAlert('Passwords do not match');
        return;
    }
    let data = {
        oldPassword: passwordOld,
        newPassword: passwordNew
    };
    let response = await fetch('/account', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/plain'
        },
        body: JSON.stringify(data)
    });
    
    let responseText = await response.text();   
    if(response.ok){
        displaySuccessAlert();
        return;
    }
    else {
        displayErrorAlert(responseText);
    }
}

function displayErrorAlert(message){
    let alert = document.getElementById('error-alert');
    let errorMessage = document.getElementById('error-message');
    errorMessage.innerText = message;
    alert.classList.remove('d-none');
    alert.classList.add('d-flex');
    setTimeout(() => {
        alert.classList.add('d-none');
        alert.classList.remove('d-flex');
    }, 4000);
}

function displaySuccessAlert(){
    let alert = document.getElementById('password-changed-alert');
    alert.classList.remove('d-none');
    alert.classList.add('d-flex');
    setTimeout(() => {
        alert.classList.add('d-none');
        alert.classList.remove('d-flex');
    }, 4000);
}