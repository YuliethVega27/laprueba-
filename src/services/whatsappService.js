import axios from 'axios';
import config from '../config/env.js';

class WhatsAppService {
  async sendMessage(to, body, messageId) {
    try {
      await axios({
        method: 'POST',
        url: `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`,
        },
        data: {
          messaging_product: 'whatsapp',
          to,
          text: { body },
          //context: {
            //message_id: messageId,
          //},
        },
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
  async markAsRead(messageId) {
    try {
      await axios({
        method: 'POST',
        url: `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`,
        },
        data: {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        },
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  async snedInteractiveButtons(to,BodyText,buttons){
    try{
      await axios({
        method: 'POST',
        url: `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`,
        },
        data: {
          messaging_product: 'whatsapp',
          to,
          type: 'interactive',
          interactive : {
            type: 'button',
            body:{ text: BodyText},
            action:{
              buttons: buttons  
            }
          }

        },
      });
    } catch(error){
      console.error(error);

    }
  }
  async sendMediaMessage(to, type, mediaUrl, caption){
    try{
      const mediaObjet={};
      switch (type) {
        case 'image':
          mediaObjet.image={link:mediaUrl , caption: caption} 
          break;
        case 'audio':
          mediaObjet.audio={link: mediaUrl}
          break;
        case 'video':
          mediaObjet.video={link:mediaUrl , caption: caption} 
          break;
        case 'document':
          mediaObjet.document = {link: mediaUrl , caption: caption, filename:'a,pdf'}
          break;
        default:
          throw new Error('Not Soported Media type');
      
      }
      await axios({
        method: 'POST',
        url: `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`,
        },
        data: {
          messaging_product: 'whatsapp',
          to,
          type: type,
          ...mediaObjet
        },
      });
    } catch(error){
      console.error('Error Standing Media',error);
    }
  }
}

export default new WhatsAppService();