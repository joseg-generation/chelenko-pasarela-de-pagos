
import main from "./src/Controller/home-controller.js";
import conn from "./src/database/conexion/conn.mongo.js";



(async ()=> {
    try {
        await conn()
    } catch (error) {
        console.error(error)
        throw error
    }
    main();
})();

