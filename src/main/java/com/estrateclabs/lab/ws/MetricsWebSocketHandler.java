package com.estrateclabs.lab.ws;

import com.estrateclabs.lab.dto.Metric;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Component
public class MetricsWebSocketHandler extends TextWebSocketHandler {

    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();
    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, org.springframework.web.socket.CloseStatus status) {
        sessions.remove(session);
    }

    @Scheduled(fixedRate = 1500)
    public void pushMetrics() throws IOException {
        if (sessions.isEmpty()) return;

        long ts = System.currentTimeMillis();
        Metric[] payload = new Metric[]{
                new Metric("Throughput", round2(80 + rand(0, 40)), ts),
                new Metric("Latency",   round2(100 + rand(0, 50)), ts),
                new Metric("Agents Active", round2(1 + rand(0, 10)), ts)
        };
        String json = mapper.writeValueAsString(payload);

        for (WebSocketSession s : sessions) {
            if (s.isOpen()) s.sendMessage(new TextMessage(json));
        }
    }

    private double rand(double a, double b) { return ThreadLocalRandom.current().nextDouble(a, b); }
    private double round2(double v) { return Math.round(v * 100.0) / 100.0; }
}