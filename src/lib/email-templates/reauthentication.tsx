import * as React from "react";
import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import { brand, container, footer, main, text } from "./styles";

interface ReauthenticationEmailProps { token: string }

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="pt-BR" dir="ltr"><Head /><Preview>Seu código de verificação</Preview>
    <Body style={main}><Container style={container}>
      <Text style={brand}>CONEXÃO PAIS</Text>
      <Heading style={{ color: "#43563d", fontSize: "28px" }}>Confirme sua identidade</Heading>
      <Text style={text}>Use este código para continuar:</Text>
      <Text style={{ color: "#43563d", fontFamily: "monospace", fontSize: "28px", fontWeight: 700, letterSpacing: "4px" }}>{token}</Text>
      <Text style={footer}>O código expira em breve. Se você não fez este pedido, ignore esta mensagem.</Text>
    </Container></Body>
  </Html>
);

export default ReauthenticationEmail;