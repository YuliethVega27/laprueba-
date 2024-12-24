import appendToSheet from './googleSheetsService.js';
import openAiservice from './openaiService.js';
import whatsappService from './whatsappService.js';

class MessageHandler {

  constructor(){
    this.appointmentState={};
    this.assistantState={};
  }
  async handleIncomingMessage(message, senderInfo) { // Usar siempre "senderInfo" con "I" mayúscula
    const fromNumber = message.from.slice(0, 2) + message.from.slice(3);

    if (message?.type === "text") {
      const incomingMessage = message.text.body.toLowerCase().trim();
      // Remove 1 from the position 2 in the from property

      // Verificar si hay un estado de cita existente para este número
      if (this.appointmentState[fromNumber]) {
        const incomingMessage = message?.text?.body?.trim();
        await this.handleAppointmentFlow(fromNumber, incomingMessage);
        return; // Salir temprano si se está manejando un flujo de cita
       }

      if (this.isGreeting(incomingMessage)) {
        await this.sendWelcomeMessage(fromNumber, message.id, senderInfo);
        await this.sendWelcomeMenu(fromNumber)
      } else if(incomingMessage == 'media'){
        await this.sendMedia(fromNumber);
      } else if(this.assistantState[fromNumber]){
        await this.handleAssistantFlow(fromNumber, incomingMessage)
      }
        else{
        const response = `Echo: ${message.text.body}`;
        await whatsappService.sendMessage(fromNumber, response, message.id);
      }
      await whatsappService.markAsRead(message.id);
    }else if (message?.type == 'interactive'){
      const option = message?.interactive?.button_reply?.title.toLowerCase().trim();
      await this.handleMenuOption(fromNumber, option);
      await whatsappService.markAsRead(message.id)
    
    }
  }
  isGreeting(message) {
    const greetings = ["hola", "hello", "hi", "buenas tardes"];
    return greetings.includes(message);
  }
  getSenderName(senderInfo) { // Consistente con la corrección de arriba
    console.log(senderInfo); // Esto te mostrará la estructura completa de senderInfo
    return senderInfo?.profile?.name || senderInfo?.wa_id || "User"; // Agregar operador de encadenamiento opcional para "name"
  }
  async sendWelcomeMessage(to, messageId, senderInfo) {
    const name = this.getSenderName(senderInfo);
    const firstName = name.split(' ')[0];
    const welcomeMessage = `Hellooooooooooooooo ${name}, ya duermete`;
    await whatsappService.sendMessage(to, welcomeMessage, messageId);
  }
  async sendWelcomeMenu(to){
    const menuMessage = "Elige una opción"
    const buttons=[
      {
        type: 'reply' , reply: {id: 'opción_1', title: 'Agendar'}
      },
      {
        type: 'reply' , reply: {id: 'opción_2', title: 'Consultar'}
      },
      {
        type: 'reply' , reply: {id: 'opción_3', title: 'Ubicación'}
      },
    ];
    await whatsappService.snedInteractiveButtons(to,menuMessage, buttons);
  
  }

  async handleMenuOption(to, option){
    let response;
    switch(option){
      case 'agendar':
        response = 'por favor, ingresa tu nombre: ';
        this.appointmentState[to]={step:'name'}
        break;
      case 'consultar':
        response= "Realiza tu consulta";
        this.assistantState[to] = { step: 'question' };
        break
        case 'Ubicación':
          response = 'Esta es nuestra ubicación';
          break
        default:
          response='Lo siento no entendí tu selección, por favor elige una de las opciones del menú'
    }
    await whatsappService.sendMessage(to, response);

  }

  async sendMedia(to){
    const mediaUrl ='https://chedrauimx.vtexassets.com/arquivos/ids/38929552-800-auto?v=638670756702100000&width=800&height=auto&aspect=true'
    const caption ='manzanita'
    const type ='image'
    await whatsappService.sendMediaMessage(to,type, mediaUrl, caption)
  }

  completeAppointment(to){
    const appointment=this.appointmentState[to];
    delete this.appointmentState[to];
    const userData=[
      to,
      appointment.name,
      appointment.petName,
      appointment.petType,
      appointment.reason,
      new Date().toISOString()
    ]

    appendToSheet(userData);
    return `Gracias por agendar tu cita. 

     Resumen de tu cita:
     Nombre: ${appointment.name}
     Nombre de la mascota: ${appointment.petName}
     Tipo de Mascota: ${appointment.petType}
     Motivo: ${appointment.reason}

     Nos ponemos en contacto contigo pronto, para confirmar la fecha y hora de tu cita`

  }

  async handleAppointmentFlow(to, message) {
    const state = this.appointmentState[to];
    let response;

    switch (state.step) {
      case 'name':
        state.name = message;
        state.step = 'petName';
        response = "Gracias, ahora, ¿cuál es el nombre de tu mascota?";
        break;
      case 'petName':
        state.petName = message;
        state.step = 'petType';
        response = '¿Qué tipo de mascota es? (por ejemplo, perro, gato, hurón, etc.)';
        break;
      case 'petType':
        state.petType = message;
        state.step = 'reason';
        response = '¿Cuál es el motivo de la consulta?';
        break;
      case 'reason':
        state.reason = message;
        response = this.completeAppointment(to);
        break;
      default:
        response = 'No reconozco ese paso, por favor comienza de nuevo.';
        break;
    }

    try {
        await whatsappService.sendMessage(to, response);
    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        // Considera enviar un mensaje de error al usuario aquí
        await whatsappService.sendMessage(to, "Hubo un error al procesar su solicitud. Por favor, intente de nuevo.");
    }
  }
  async handleAssistantFlow(to, message) {
    const state = this.assistantState[to];
    let response;
  
    const menuMessage = "La respuesta fue de tu ayuda?";
    const buttons = [
      { type: 'reply', reply: { id: 'option_4', title: 'Sí, gracias' } },
      { type: 'reply', reply: { id: 'option_5', title: 'Hacer otra pregunta' } },
      { type: 'reply', reply: { id: 'option_6', title: 'Emergencia' } },
    ];
  
    if (state.step == 'question') {
      response = await openAiservice(message);
      // Consider adding error handling here to manage possible issues from the AI service
      if (!response) {
        response = "Lo siento, no pude procesar tu respuesta en este momento. Por favor, intenta de nuevo.";
      }
    }
  
    // Send the response before deleting state to ensure response is handled
    if (response) {
      await whatsappService.sendMediaMessage(to, response);
    }
  
    await whatsappService.snedInteractiveButtons(to, menuMessage, buttons);
  
    // Delete the state after all actions have been attempted
    delete this.assistantState[to];
  }
  
}
export default new MessageHandler();
