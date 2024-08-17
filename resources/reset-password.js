async function resetPassword() {
    let alert = document.getElementById('sent-alert');
    alert.classList.remove('d-none');
    setTimeout(() => {
        alert.classList.add('d-none');
    }, 4000);
    let address = document.getElementById('email').value;

    grecaptcha.ready(function () {
        grecaptcha.execute('6Lfh6icqAAAAAJeo6_k1ecHiyiD6A3LNtSzYQPr2', { action: 'submit' }).then(function (token) {
            fetch('/passreset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ address, token })
            });
        })

    });
}