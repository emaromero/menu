// Al inicio del script del admin (antes de ejecutar el resto del código)
const passwordCorrecta = ""; // define la contraseña
const pass = prompt("Ingrese la contraseña de administrador:");
if (pass !== passwordCorrecta) {
    document.body.innerHTML = "<h1>Acceso denegado</h1>";
    throw new Error("Acceso denegado");
}
