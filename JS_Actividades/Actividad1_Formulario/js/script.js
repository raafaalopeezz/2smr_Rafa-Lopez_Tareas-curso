const form = document.getElementById("formRegistro");
const mensaje = document.getElementById("mensaje");

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const password2 = document.getElementById("password2").value;

    if (nombre === "" || email === "" || password === "" || password2 === "") {
        mensaje.textContent = "Todos los campos son obligatorios";
        mensaje.style.color = "red";
        return;
    }

    if (password !== password2) {
        mensaje.textContent = "Las contraseñas no coinciden";
        mensaje.style.color = "red";
        return;
    }

    mensaje.textContent = "Registro correcto ✅";
    mensaje.style.color = "green";
});
