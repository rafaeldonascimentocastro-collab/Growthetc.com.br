/* Growth.Etc — configuração de medição (opcional).
   Deixe os dois campos vazios para NÃO carregar nenhuma ferramenta de medição: sem cookies e sem aviso de cookies.
   Para ativar, preencha UM dos dois (não os dois):
     gtmId: 'GTM-XXXXXXX'      → Google Tag Manager (recomendado se você já usa o GTM)
     ga4Id: 'G-XXXXXXXXXX'     → Google Analytics 4 direto
   Com um ID preenchido, o site passa a mostrar o aviso de cookies e só carrega o Google depois que a pessoa clica em "Aceitar".
   Os eventos (cliques nos botões, envios de formulário, WhatsApp) já são enviados ao dataLayer: veja o LEIAME. */
window.GE_CONFIG = {
  gtmId: '',
  ga4Id: ''
};
