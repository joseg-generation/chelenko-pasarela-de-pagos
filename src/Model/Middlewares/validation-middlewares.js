import Transaction from "../../database/model/transaction.model.js";

// Creamos middleware de validacion de datos del cliente:
const validateDataClient = async (req, res, next) => {

    try {
        // Obtenemos datos desde formulario | sessionId debe ser igual a idGuesT
        req.buyOrder = req.body.buyOrder;
        req.sessionId = req.body.sessionId;
        req.amount = req.body.amount; 
        req.returnUrl = req.body.returnUrl;
        req.idGuesT = req.body.IdGuesT

        if (!req.buyOrder || !req.sessionId || !req.amount || !req.returnUrl || !req.idGuesT) {
            console.log('Faltan datos en el formulario');
            return res.status(400).send('Faltan datos en el formulario');
        } else {
            console.log("Datos recibidos del formulario: BuyOrder:", req.buyOrder, "| sessionId:", req.sessionId, "| amount:", req.amount, "| returnUrl:", req.returnUrl, "| IdGuest:", req.idGuesT);

            // capturar datos y enviarlos a la base de datos antes de continuar

           const newTransaction = await Transaction.create({
                guest: req.idGuesT,
                buyOrder: req.buyOrder,
                sessionId: req.sessionId,
                amount: req.amount
            })

            await newTransaction.save();

            console.log("nueva transacción: ", newTransaction);
            
            next();
        }

    } catch (error) {

        console.error('Error al validar datos del cliente:', error);
        res.status(500).send('Error al validar datos del cliente:'); 
    }
};


// Creamos middleware de validacion de datos de retorno Transbank:
const validateDataClientTransbank = (req, res, next) => {

    try {
        // Obtener parámetros del cuerpo o query, según el método
        req.tokenWs2 = req.body.token_ws || req.query.token_ws;
        req.tbkToken = req.body.TBK_TOKEN || req.query.TBK_TOKEN;
        req.tbkOrdenCompra = req.body.TBK_ORDEN_COMPRA || req.query.TBK_ORDEN_COMPRA;
        req.tbkIdSesion = req.body.TBK_ID_SESION || req.query.TBK_ID_SESION;

        if (!req.tokenWs2 && !req.tbkToken && !req.tbkOrdenCompra && !req.tbkIdSesion) {
            console.log('No se encontraron parámetros de respuesta de Transbank');
            return res.status(400).send('No se encontraron parámetros de respuesta de Transbank');

        } else {

            // Creamos objeto con la posible data de Transbank:
            req.dataTransbank = {
            token_ws: req.tokenWs2,
            TBK_TOKEN: req.tbkToken,
            TBK_ORDEN_COMPRA: req.tbkOrdenCompra,
            TBK_ID_SESION: req.tbkIdSesion
            }

            // Mostrar los posibles datos recibidos para depuración
            console.log("Request Body:", req.body);
            console.log("Request Query:", req.query);
            console.log("Mostramos datos recibidos por Transbank");
            console.log('token_ws:', req.tokenWs2);
            console.log('TBK_TOKEN:', req.tbkToken);
            console.log('TBK_ORDEN_COMPRA:', req.tbkOrdenCompra);
            console.log('TBK_ID_SESION:', req.tbkIdSesion);
            console.log('');

            next();
        } 

    } catch (error) {
        console.error('Error al validar datos de retorno de Transbank:', error);
        res.status(500).send('Error al validar datos de retorno de Transbank:'); 
    }
};

export {validateDataClientTransbank, validateDataClient};