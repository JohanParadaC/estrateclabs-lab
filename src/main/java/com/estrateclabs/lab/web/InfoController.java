package com.estrateclabs.lab.web;

import com.estrateclabs.lab.dto.VisionDTO;
import com.estrateclabs.lab.dto.WhatDTO;
import com.estrateclabs.lab.dto.WhoDTO;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class InfoController {

    @GetMapping("/who")
    public WhoDTO who() {
        return new WhoDTO(
                "Estrateclabs: laboratorio de innovación aplicada",
                new String[]{
                        "No somos software factory; somos un hub estratégico que combina I+D con ejecución confiable",
                        "Aliado de startups, corporaciones e inversionistas",
                        "Cada proyecto es semilla de datos, investigación y posibles spin-offs"
                }
        );
    }

    @GetMapping("/what")
    public WhatDTO what() {
        String[][] projects = new String[][]{
                {"NeuroOps", "Orquestación de agentes para automatizar procesos críticos"},
                {"DataPulse", "Streaming de datos en tiempo real para decisiones tácticas"},
                {"ProtoX", "Incubación rápida de spin-offs desde pilotos exitosos"}
        };
        String[] capabilities = new String[]{
                "Ejecución tecnológica crítica",
                "Investigación aplicada y captura de datos",
                "Incubación de negocios disruptivos"
        };
        return new WhatDTO(capabilities, projects);
    }

    @GetMapping("/vision")
    public VisionDTO vision() {
        return new VisionDTO(
                "Hub latinoamericano que crea, desde proyectos reales, ideas que transforman industrias",
                new String[]{
                        "Explorar → Probar tecnologías de frontera en problemas reales",
                        "Escalar → Convertir aprendizajes en plataformas reutilizables",
                        "Spin-off → Lanzar nuevos negocios con tracción y datos"
                }
        );
    }
}