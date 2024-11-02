import pkg from 'transbank-sdk';
const { WebpayPlus, Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes } = pkg;
import express from 'express';
import morgan from 'morgan';
import createTransaction, { amount as monto } from '../Model/Service/crear-transaccion.js'; // Importar función crear transaccion
import confirmTransaction from '../Model/Service/confirmar-transaccion.js'; // Importar función confirmar transaccion
import consultarTransaccion from '../Model/Service/estado-transaccion.js'; // Importar la función de consulta de transacción
import { fileURLToPath } from 'url';  // Importar `fileURLToPath` desde `url` para manejar ES Modules
import { dirname } from 'path';        // Importar `dirname` desde `path` para obtener el directorio
import path from 'path';

// Definir `__dirname` manualmente para un entorno de ES Module
const __filename = fileURLToPath(import.meta.url);  // Convertir la URL del módulo en una ruta de archivo
const __dirname = dirname(__filename);              // Obtener el nombre del directorio actual

function main() {
    const app = express();
    const port = 3000;

    // Configurar Express para servir archivos estáticos (como CSS)
    app.use(express.static('public'));

    // Middleware para registrar solicitudes y parsear datos JSON y URL encoded
    app.use(morgan('dev'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Configura el ruteo de las vistas
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, '../views'));

    // Objetos para almacenar información entre las diferentes rutas:
    let transactionIdGuesT = {};

    // Ruta para la página inicial con el botón de pago
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../views', 'form.html'));
    });
    
    // Ruta para crear la transacción con Transbank
    app.post('/iniciar-pago', async (req, res) => {
        try {
            
            // Obtenemos datos desde formulario
            let buyOrder = req.body.buyOrder;
            let sessionId = req.body.sessionId;
            let amount = req.body.amount; 
            let returnUrl = req.body.returnUrl;
            let idGuesT = req.body.IdGuesT

            // Almacenamos datos en objeto para luego pasarlos a la función de confirmar transacción
            transactionIdGuesT["idGuesT"] = idGuesT;
            
            // Llamamos a la función crear transacción
            console.log("Datos recibidos del formulario: BuyOrder:", buyOrder, "| sessionId:", sessionId, "| amount:", amount, "| returnUrl:", returnUrl, "| IdGuest:", idGuesT);
            let response = await createTransaction(buyOrder, sessionId, amount, returnUrl);

            if (response && response.formAction && response.tokenWs) {

                // generamos objeto para pasar datos a formato JSON
                let responseCreateTransaction = {
                    tokenWs: response.tokenWs,
                    formAction: response.formAction
                }

                res.status(200).json(responseCreateTransaction); // Pasamos datos a front en formato JSON
                
                /*
                // Redirigir al usuario directamente al formulario de Webpay
                res.redirect(`${response.formAction}?token_ws=${response.tokenWs}`);
                */
                
            } else {
                throw new Error('Error al redirigir al usuario');
            }
        } catch (error) {
            console.error('Error al crear la transacción:', error);
            res.status(500).send('Error al iniciar la transacción');
        }
    });
    
    // Ruta para manejar el retorno de Transbank
    app.all('/retorno', async (req, res) => {
        
        console.log("BANDERA transactionIdGuesT:", transactionIdGuesT);
        // Obtenemos datos del objeto transactionIdGuesT:
        let idGuesT = transactionIdGuesT.idGuesT;

        // Obtener parámetros del cuerpo o query, según el método
        let tokenWs2 = req.body.token_ws || req.query.token_ws;
        let tbkToken = req.body.TBK_TOKEN || req.query.TBK_TOKEN;
        let tbkOrdenCompra = req.body.TBK_ORDEN_COMPRA || req.query.TBK_ORDEN_COMPRA;
        let tbkIdSesion = req.body.TBK_ID_SESION || req.query.TBK_ID_SESION;
    
        // Mostrar los datos recibidos para depuración
        console.log("Request Body:", req.body);
        console.log("Request Query:", req.query);
        console.log("Mostramos datos recibidos por Transbank");
        console.log('token_ws:', tokenWs2);
        console.log('TBK_TOKEN:', tbkToken);
        console.log('TBK_ORDEN_COMPRA:', tbkOrdenCompra);
        console.log('TBK_ID_SESION:', tbkIdSesion);
        console.log('');

        try {
            // Si existe token_ws, la transacción fue exitosa o rechazada
            if (tokenWs2) {
                let confirmation = await confirmTransaction(tokenWs2);
                console.log('Transacción correcta. El pago ha sido aprobado o rechazado.');

                let responseConfirmTransaction = {
                    idGuesT : idGuesT,
                    tokenWs2 : tokenWs2,
                    vci : confirmation.vci,
                    amount : confirmation.amount,
                    status : confirmation.status,
                    buyOrder : confirmation.buy_order,
                    sessionId : confirmation.session_id,
                    cardDetail : confirmation.card_detail,
                    accountingDate : confirmation.accounting_date,
                    transactionDate : confirmation.transaction_date,
                    authorizationCode : confirmation.authorization_code,
                    paymentTypeCode : confirmation.payment_type_code,
                    responseCode : confirmation.response_code
                }

                if (confirmation.response_code === 0) {
                    let formaAbono;
                    switch (confirmation.payment_type_code) {
                        case 'VD':
                            formaAbono = 'Débito';
                            break;
                        case 'VN':
                            formaAbono = 'Crédito (Venta Normal)';
                            break;
                        case 'VC':
                            formaAbono = 'Crédito (Venta en Cuotas)';
                            break;
                        case 'SI':
                            formaAbono = 'Crédito (Cuotas Sin Interés)';
                            break;
                        case 'S2':
                            formaAbono = 'Crédito (2 Cuotas Sin Interés)';
                            break;
                        case 'NC':
                            formaAbono = 'Crédito (N Cuotas)';
                            break;
                        default:
                            formaAbono = 'Desconocido';
                    }
                    console.log("El pago ha sido aprobado");
                    res.status(200).send(responseConfirmTransaction);
                    /*
                    res.render('pago-aprobado', {
                        titular: 'Nombre del titular', // Aquí deberías reemplazar con el valor real si está disponible
                        tarjeta: confirmation.card_detail.card_number,
                        monto: confirmation.amount,
                        forma_abono: formaAbono, // Forma de abono interpretada
                        fecha_hora: confirmation.transaction_date,
                        codigo_transaccion: confirmation.buy_order,
                        codigo_autorizacion: confirmation.authorization_code
                    });
                    */
                } else {
                    console.log("El pago ha sido rechazado");
                    res.status(200).send(responseConfirmTransaction);
                   // res.redirect('/pago-rechazado');
                }
            }
            // Si existe TBK_TOKEN, TBK_ORDEN_COMPRA y TBK_ID_SESION, el pago fue abortado
            else if (tbkToken && tbkOrdenCompra && tbkIdSesion) {
                console.log('Transacción abortada.');
                res.redirect('/pago-rechazado');
            }
            // Si existe TBK_ORDEN_COMPRA y TBK_ID_SESION, la transacción ha excedido el tiempo (timeout)
            else if (tbkOrdenCompra && tbkIdSesion) {
                console.log('Transacción abortada por timeout.');
                res.redirect('/pago-rechazado');
            }
            // Si no se encuentra ninguna variable, indicar un error
            else {
                console.log('Error en el proceso de pago. No se encontraron parámetros.');
                res.status(400).send('Error en el proceso de pago. No se encontraron parámetros.');
            }
        } catch (error) {
            console.error('Error al confirmar la transacción:', error);
            res.status(500).send('Error en el servidor al procesar el pago.');
        }
    });

    // Ruta para mostrar la pantalla de pago rechazado
    app.get('/pago-rechazado', (req, res) => {
        res.sendFile(path.join(__dirname, '../views', 'pago-rechazado.html'));  
    });
    
    // Ruta para consultar el estado de una transacción
    app.get('/consultar-transaccion/:token', async (req, res) => {
        const token = req.params.token; // Obtener el token de la URL
        try {
            const response = await consultarTransaccion(token);
            if (response) {
                res.json(response); // Retornar la respuesta en formato JSON
            } else {
                res.status(404).send('Transacción no encontrada');
            }
        } catch (error) {
            console.error('Error al consultar la transacción:', error);
            res.status(500).send('Error al consultar el estado de la transacción');
        }
    });
   

    app.listen(port, () => {
        console.log(`Servidor escuchando en http://localhost:${port}`);
    });
}

export default main;
