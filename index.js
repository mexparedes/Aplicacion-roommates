const url = require("url")
const http = require("http")
const fs = require("fs");
const { v4: uuidv4 } = require('uuid');
const nuevoRoommate = require('./roommates');
const enviar = require("./mailer");

http
    .createServer(async (req, res) => { 
        // INICIAL
        try {
            if (req.url == "/" && req.method == "GET") {
            res.setHeader("content-type", "text/html");
            res.end(fs.readFileSync("index.html", "utf8"));
            } 
        } catch (error){
        console.error(error);
    }
        //AGREGAR NUEVO ROOMMATE
        try {
            if (req.url.startsWith("/roommate") && req.method == "POST") {
            let roommate = await nuevoRoommate() 
            guardarRoommate(roommate);
            res.end(JSON.stringify(roommate));
            }
        } catch (error) {
            console.error(error);
        }    
        //DEVOLVER TODOS LOS ROOMMATES
        try {
            if (req.url.startsWith("/roommates") && req.method == "GET") {
            res.setHeader("Content-Type", "application/json");
            res.end(fs.readFileSync("roommates.json", "utf8"));
            }
        } catch (error){
            console.error(error);
        }    
        //AGREGAR GASTO
        try {
            if (req.url.startsWith("/gasto") && req.method == "POST") {
            let body = "";
            req.on("data", (chunk) => {    
                body += chunk.toString()
            });
            req.on("end", () => {
                const nuevoGasto = JSON.parse(body);
                nuevoGasto.id = uuidv4().slice(30);
                guardarGasto(nuevoGasto);
                res.end(JSON.stringify(nuevoGasto));
            })
            };
        } catch (error){
            console.error(error);
        }
        //DEVOLVER TODOS LOS GASTOS
        try {
            if (req.url.startsWith("/gastos") && req.method == "GET") {
            res.setHeader("Content-Type", "application/json");
            res.end(fs.readFileSync("gastos.json", "utf8"));
            }
        } catch (error){
            console.error(error);
        }    
        //EDITAR GASTO
        try {
            if (req.url.includes("/gasto?id=") && req.method == "PUT") {
            const { id } = url.parse(req.url, true).query
            let body = "";
            req.on("data", (chunk) => {     
                body += chunk.toString()
            });
            req.on("end", () => {
                let gasto = JSON.parse(body);
                editarGasto(gasto, id);
                res.end(JSON.stringify(gasto));
            })
            }
        } catch (error){
            console.error(error);
        }    
        //ELIMINAR GASTO
        try {
            if (req.url.includes("/gasto?id=") && req.method == "DELETE") {
            const { id } = url.parse(req.url, true).query
            eliminarGasto( id );
            res.end(); 
            }
        } catch (error){
            console.error(error);
        }
    })
    .listen(3000, () => console.log("Sirviendo en el puerto 3000"));

            //FUNCIONES

            function guardarRoommate(roommate) {
            const roommatesJSON = JSON.parse(fs.readFileSync("roommates.json", "utf8"));
            roommatesJSON.roommates.push(roommate);
            fs.writeFileSync("roommates.json", JSON.stringify(roommatesJSON));
        }

        function guardarGasto(gasto) {
            calcular(gasto);  
            enviarCorreos(gasto);
        }

        function editarGasto(gasto, id) {
            const gastosJSON = JSON.parse(fs.readFileSync("gastos.json", "utf8"));
            const roommatesJSON = JSON.parse(fs.readFileSync("roommates.json", "utf8"));
            let gastoPrevio = 0;
            gastosJSON.gastos.forEach(element => {
                if (element.id == id){
                    gastoPrevio = element.monto;
                }    
            });
            const montoIndividual = (gastoPrevio / roommatesJSON.roommates.length);

            //PRIMERO ELIMINAMOS EL GASTO ANTERIOR
            for( let j = 0; j < roommatesJSON.roommates.length; j++){

                if( gasto.roommate == roommatesJSON.roommates[j].nombre ){  //Potencial error por strings nombre creado con interpolacion
                    
                    roommatesJSON.roommates[j].recibe -= montoIndividual;

                } else {

                    roommatesJSON.roommates[j].debe -= montoIndividual;
                }
            }
            // LUEGO AGREGAMOS EL NUEVO MONTO 
            const nuevoMontoIndividual = (gasto.monto / roommatesJSON.roommates.length);

            for( let j = 0; j < roommatesJSON.roommates.length; j++){

                if( gasto.roommate == roommatesJSON.roommates[j].nombre ){  //Potencial error por strings nombre creado con interpolacion
                    
                    roommatesJSON.roommates[j].recibe += nuevoMontoIndividual;

                } else {

                    roommatesJSON.roommates[j].debe += nuevoMontoIndividual;
                }
            }

            gastosJSON.gastos.forEach(element => {
                if (element.id == id){
                    element.monto = gasto.monto;
                }    
            }); 

            fs.writeFileSync("gastos.json", JSON.stringify(gastosJSON));
            fs.writeFileSync("roommates.json", JSON.stringify(roommatesJSON));
        }

        function eliminarGasto( id ) {
            const gastosJSON = JSON.parse(fs.readFileSync("gastos.json", "utf8"));
            const roommatesJSON = JSON.parse(fs.readFileSync("roommates.json", "utf8"));

            let gasto = gastosJSON.gastos.filter( gasto => gasto.id == id );  //Aca encontramos el gasto
            const montoIndividual = (gasto[0].monto / roommatesJSON.roommates.length);

            for( let j = 0; j < roommatesJSON.roommates.length; j++){
                if( gasto[0].roommate == roommatesJSON.roommates[j].nombre ){  //Potencial error por strings nombre creado con interpolacion
                    
                    roommatesJSON.roommates[j].recibe -= montoIndividual;

                } else {

                    roommatesJSON.roommates[j].debe -= montoIndividual;
                }
            }

            let gastosFinal = gastosJSON.gastos.filter( gasto => gasto.id != id ) // esoy retornado un arreglo no el json
            gastosJSON.gastos = gastosFinal;
            fs.writeFileSync("gastos.json", JSON.stringify(gastosJSON));
            fs.writeFileSync("roommates.json", JSON.stringify(roommatesJSON));

        }
    
        function calcular(gasto) {
            const gastosJSON = JSON.parse(fs.readFileSync("gastos.json", "utf8"));
            const roommatesJSON = JSON.parse(fs.readFileSync("roommates.json", "utf8"));
            gastosJSON.gastos.push(gasto);
            
                const montoIndividual = (gasto.monto / roommatesJSON.roommates.length)

                for( let j = 0; j < roommatesJSON.roommates.length; j++){

                    if( gasto.roommate == roommatesJSON.roommates[j].nombre ){  //Potencial error por strings nombre creado con interpolacion
                        
                        roommatesJSON.roommates[j].recibe += montoIndividual;

                    } else {

                        roommatesJSON.roommates[j].debe += montoIndividual;
                    }
                }
            fs.writeFileSync("gastos.json", JSON.stringify(gastosJSON));
            fs.writeFileSync("roommates.json", JSON.stringify(roommatesJSON));
        }

        function enviarCorreos( gasto ){
            const roommatesJSON = JSON.parse(fs.readFileSync("roommates.json", "utf8"));
            let correos = roommatesJSON.roommates.map( (x) => {
                return x.email;
            });
            correos.push('maildepruebasecamp@gmail.com');
            const textoSalida = `Se ha agregado un nuevo gasto a nombre de: ${gasto.roommate}
                                por un monto de : ${gasto.monto}`
            enviar(correos.join(','),'Se ha registrado un nuevo gasto', textoSalida);
        }