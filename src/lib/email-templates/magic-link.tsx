import * as React from "react";
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import { brand, button, container, footer, main, text } from "./styles";

interface MagicLinkEmailProps { siteName: string; confirmationUrl: string }

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="pt-BR" dir="ltr"><Head /><Preview>Seu acesso ao {siteName}</Preview>
    <Body style={main}><Container style={container}>
      <Text style={brand}>CONEXÃO PAIS</Text>
      <Heading style={{ color: "#43563d", fontSize: "28px" }}>Acesse sua conta</Heading>
      <Text style={text}>Use o botão abaixo para entrar. Este acesso é pessoal e expira em breve.</Text>
      <Button style={button} href={confirmationUrl}>Entrar no Conexão Pais</Button>
      <Text style={footer}>Se você não pediu este acesso, ignore esta mensagem.</Text>
    </Container></Body>
  </Html>
);

export default MagicLinkEmail;