/* Growth.Etc — configuração do site.

   MEDIÇÃO (opcional)
   Deixe gtmId e ga4Id vazios para NÃO carregar nenhuma ferramenta de medição: sem cookies e sem aviso de cookies.
   Para ativar, preencha UM dos dois (não os dois):
     gtmId: 'GTM-XXXXXXX'      → Google Tag Manager (recomendado: nele você liga GA4, Google Ads e Meta Pixel)
     ga4Id: 'G-XXXXXXXXXX'     → Google Analytics 4 direto
   Com um ID preenchido, o site passa a mostrar o aviso de cookies e só carrega o Google depois que a pessoa clica em "Aceitar".
   Eventos enviados ao dataLayer: generate_lead (na página obrigado.html, uma vez por lead), form_submit, form_submit_fail,
   whatsapp_click, cta_* e portfolio_*. Para conversão no Google Ads ou no Meta, use o evento generate_lead
   (ou a visualização da página /obrigado.html).

   CAPTURA DE LEADS
   leadEndpoint: para onde os formulários enviam os leads (JSON via POST).
     Hoje: FormSubmit (e-mail para a caixa abaixo). Para mandar direto ao CRM, troque por um endpoint próprio
     (HubSpot Forms, RD Station ou uma planilha via Google Apps Script) que responda { "success": true }.
   leadEmail: caixa que recebe as cópias (aparece nos avisos de falha e no link de e-mail de reserva). */
window.GE_CONFIG = {
  gtmId: '',
  ga4Id: '',
  leadEndpoint: 'https://formsubmit.co/ajax/growthetc@gmail.com',
  leadEmail: 'growthetc@gmail.com',
  whatsapp: '5511992253454'
};
