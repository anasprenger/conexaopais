import * as React from "react";
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import { brand, button, container, footer, main, text } from "./styles";

interface RecoveryEmailProps { siteName: string; confirmationUrl: string }

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Redefina sua senha do {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>CONEXÃO PAIS</Text>
        <Heading style={{ color: "#43563d", fontSize: "28px" }}>Redefina sua senha</Heading>
        <Text style={text}>Recebemos um pedido para criar uma nova senha para sua conta.</Text>
        <Button style={button} href={confirmationUrl}>Criar nova senha</Button>
        <Text style={footer}>Se você não fez este pedido, ignore esta mensagem. Sua senha continuará igual.</Text>
      </Container>
    </Body>
  </Html>
);

export default RecoveryEmail;