const API_URL = "PEGAR_AQUI_LA_URL_DE_APPS_SCRIPT";

/* =========================
   ELEMENTOS DEL DOM
========================= */

const loginSection = document.getElementById("loginSection");
const portalSection = document.getElementById("portalSection");

const loginForm = document.getElementById("loginForm");
const solicitudForm = document.getElementById("solicitudForm");

const correoLogin = document.getElementById("correoLogin");
const pinLogin = document.getElementById("pinLogin");

const tipoSolicitud = document.getElementById("tipoSolicitud");
const titulo = document.getElementById("titulo");
const descripcion = document.getElementById("descripcion");
const prioridad = document.getElementById("prioridad");

const usuarioId = document.getElementById("usuarioId");
const usuarioNombre = document.getElementById("usuarioNombre");
const usuarioCorreo = document.getElementById("usuarioCorreo");

const tablaSolicitudesBody = document.getElementById("tablaSolicitudesBody");

const btnActualizar = document.getElementById("btnActualizar");
const btnCerrarSesion = document.getElementById("btnCerrarSesion");
const btnImprimir = document.getElementById("btnImprimir");

const loadingMessage = document.getElementById("loadingMessage");
const successMessage = document.getElementById("successMessage");
const errorMessage = document.getElementById("errorMessage");

/* =========================
   INICIALIZACIÓN
========================= */

document.addEventListener("DOMContentLoaded", () => {
    verificarSesion();

    loginForm.addEventListener("submit", manejarLogin);
    solicitudForm.addEventListener("submit", manejarCrearSolicitud);

    btnActualizar.addEventListener("click", listarSolicitudes);
    btnCerrarSesion.addEventListener("click", cerrarSesion);
    btnImprimir.addEventListener("click", imprimirSolicitudes);
});

/* =========================
   LOGIN
========================= */

async function manejarLogin(event) {
    event.preventDefault();

    ocultarMensajes();

    const correo = correoLogin.value.trim();
    const pin = pinLogin.value.trim();

    if (!correo || !pin) {
        mostrarError("Debe ingresar correo y PIN.");
        return;
    }

    try {
        mostrarCarga("Validando usuario...");

        const params = new URLSearchParams();
        params.append("accion", "login");
        params.append("correo", correo);
        params.append("pin", pin);

        const response = await fetch(API_URL, {
            method: "POST",
            body: params
        });

        const data = await response.json();

        ocultarMensajes();

        if (!data.success) {
            mostrarError(data.message || "Credenciales inválidas.");
            return;
        }

        sessionStorage.setItem("usuario", JSON.stringify(data.usuario));

        mostrarPortal(data.usuario);

        mostrarExito("Inicio de sesión exitoso.");

    } catch (error) {
        ocultarMensajes();
        mostrarError("No fue posible iniciar sesión.");
        console.error(error);
    }
}

/* =========================
   SESIÓN
========================= */

function verificarSesion() {
    const usuarioGuardado = sessionStorage.getItem("usuario");

    if (!usuarioGuardado) {
        mostrarLogin();
        return;
    }

    const usuario = JSON.parse(usuarioGuardado);

    mostrarPortal(usuario);
}

function mostrarPortal(usuario) {
    loginSection.hidden = true;
    portalSection.hidden = false;

    btnActualizar.hidden = false;
    btnCerrarSesion.hidden = false;
    btnImprimir.hidden = false;

    usuarioId.textContent = usuario.idUsuario || "";
    usuarioNombre.textContent = usuario.nombre || "";
    usuarioCorreo.textContent = usuario.correo || "";

    listarSolicitudes();
}

function mostrarLogin() {
    loginSection.hidden = false;
    portalSection.hidden = true;

    btnActualizar.hidden = true;
    btnCerrarSesion.hidden = true;
    btnImprimir.hidden = true;

    loginForm.reset();
    solicitudForm.reset();
}

function cerrarSesion() {
    sessionStorage.removeItem("usuario");

    tablaSolicitudesBody.innerHTML = "";

    mostrarLogin();

    mostrarExito("Sesión cerrada correctamente.");
}

/* =========================
   CREAR SOLICITUD
========================= */

async function manejarCrearSolicitud(event) {
    event.preventDefault();

    ocultarMensajes();

    const usuario = obtenerUsuarioSesion();

    if (!usuario) {
        mostrarError("La sesión no es válida.");
        return;
    }

    if (
        !tipoSolicitud.value.trim() ||
        !titulo.value.trim() ||
        !descripcion.value.trim() ||
        !prioridad.value.trim()
    ) {
        mostrarError("Debe completar todos los campos.");
        return;
    }

    try {
        mostrarCarga("Registrando solicitud...");

        const params = new URLSearchParams();

        params.append("accion", "crearSolicitud");
        params.append("idUsuario", usuario.idUsuario);
        params.append("solicitante", usuario.nombre);
        params.append("correo", usuario.correo);

        params.append("tipoSolicitud", tipoSolicitud.value.trim());
        params.append("titulo", titulo.value.trim());
        params.append("descripcion", descripcion.value.trim());
        params.append("prioridad", prioridad.value.trim());

        const response = await fetch(API_URL, {
            method: "POST",
            body: params
        });

        const data = await response.json();

        ocultarMensajes();

        if (!data.success) {
            mostrarError(data.message || "No fue posible registrar la solicitud.");
            return;
        }

        solicitudForm.reset();

        mostrarExito("Solicitud registrada correctamente.");

        listarSolicitudes();

    } catch (error) {
        ocultarMensajes();
        mostrarError("Error al registrar la solicitud.");
        console.error(error);
    }
}

/* =========================
   LISTAR SOLICITUDES
========================= */

async function listarSolicitudes() {
    ocultarMensajes();

    const usuario = obtenerUsuarioSesion();

    if (!usuario) {
        mostrarError("Debe iniciar sesión.");
        return;
    }

    try {
        mostrarCarga("Consultando solicitudes...");

        const params = new URLSearchParams();

        params.append("accion", "listarSolicitudes");
        params.append("idUsuario", usuario.idUsuario);

        const response = await fetch(API_URL, {
            method: "POST",
            body: params
        });

        const data = await response.json();

        ocultarMensajes();

        if (!data.success) {
            mostrarError(data.message || "No fue posible consultar las solicitudes.");
            return;
        }

        construirTabla(data.solicitudes || []);

    } catch (error) {
        ocultarMensajes();
        mostrarError("Error al consultar solicitudes.");
        console.error(error);
    }
}

/* =========================
   TABLA
========================= */

function construirTabla(solicitudes) {
    tablaSolicitudesBody.innerHTML = "";

    if (!solicitudes.length) {
        tablaSolicitudesBody.innerHTML = `
            <tr>
                <td colspan="7">
                    No existen solicitudes registradas.
                </td>
            </tr>
        `;
        return;
    }

    solicitudes.forEach((solicitud) => {

        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td>${solicitud.idSolicitud || ""}</td>
            <td>${solicitud.fechaRegistro || ""}</td>
            <td>${solicitud.tipoSolicitud || ""}</td>
            <td>${solicitud.titulo || ""}</td>
            <td>${solicitud.descripcion || ""}</td>
            <td>${solicitud.prioridad || ""}</td>
            <td>${solicitud.estado || ""}</td>
        `;

        tablaSolicitudesBody.appendChild(fila);
    });
}

/* =========================
   IMPRESIÓN
========================= */

function imprimirSolicitudes() {
    window.print();
}

/* =========================
   MENSAJES
========================= */

function ocultarMensajes() {
    loadingMessage.hidden = true;
    successMessage.hidden = true;
    errorMessage.hidden = true;
}

function mostrarCarga(mensaje) {
    ocultarMensajes();

    loadingMessage.textContent = mensaje;
    loadingMessage.hidden = false;
}

function mostrarExito(mensaje) {
    ocultarMensajes();

    successMessage.textContent = mensaje;
    successMessage.hidden = false;
}

function mostrarError(mensaje) {
    ocultarMensajes();

    errorMessage.textContent = mensaje;
    errorMessage.hidden = false;
}

/* =========================
   UTILIDADES
========================= */

function obtenerUsuarioSesion() {
    const usuarioGuardado = sessionStorage.getItem("usuario");

    if (!usuarioGuardado) {
        return null;
    }

    return JSON.parse(usuarioGuardado);
}