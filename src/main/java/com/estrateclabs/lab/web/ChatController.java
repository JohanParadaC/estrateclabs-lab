package com.estrateclabs.lab.web;

import com.estrateclabs.lab.dto.ChatRequest;
import com.estrateclabs.lab.dto.ChatResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ChatController {

    @PostMapping("/chat")
    public ChatResponse chat(@RequestBody ChatRequest req) {
        String msg = (req.message() == null ? "" : req.message().toLowerCase());

        String reply;
        if (msg.contains("quiénes") || msg.contains("quienes") || msg.contains("quién") || msg.contains("quien")) {
            reply = "Somos un laboratorio de innovación aplicada: unimos ejecución confiable con investigación para crear spin-offs.";
        } else if (msg.contains("qué hacen") || msg.contains("que hacen") || msg.contains("hacen") || msg.contains("servicios")) {
            reply = "Ejecutamos proyectos tecnológicos críticos, convertimos cada proyecto en fuente de datos e incubamos nuevos negocios.";
        } else if (msg.contains("visión") || msg.contains("vision") || msg.contains("futuro") || msg.contains("meta")) {
            reply = "Ser el hub latinoamericano que, desde proyectos reales, crea ideas de negocio disruptivas.";
        } else {
            reply = "Puedo contarte sobre: quiénes somos, qué hacemos y nuestra visión. ¿Qué te gustaría explorar?";
        }
        return new ChatResponse(reply);
    }
}