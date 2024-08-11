async function resetPassword() {
    let alert = document.getElementById('sent-alert');
    alert.classList.remove('d-none');
    setTimeout(()=>{
        alert.classList.add('d-none');
    }, 4000);
    let address = document.getElementById('email').value;
    console.log(address);
    await fetch('/passreset', {
        method: 'POST',
        headers: {
            'Content-Type' : 'application/json'
        },
        body : JSON.stringify({address})
    });
}