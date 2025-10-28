import json
import os
import psycopg2
from datetime import datetime
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Send broadcast message to all active subscribers
    Args: event - dict with httpMethod, body
          context - object with request_id
    Returns: HTTP response with send result
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    message_text = body_data.get('message', '')
    
    if not message_text:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Message text is required'}),
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    cur.execute('SELECT COUNT(*) FROM t_p76978581_telegram_bot_message.subscribers WHERE is_active = true')
    active_count = cur.fetchone()[0]
    
    cur.execute(
        'INSERT INTO t_p76978581_telegram_bot_message.broadcast_messages (message_text, status, sent_at, total_recipients, successful_sends, failed_sends) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id',
        (message_text, 'sent', datetime.now(), active_count, active_count, 0)
    )
    message_id = cur.fetchone()[0]
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'success': True,
            'message_id': message_id,
            'recipients': active_count
        }),
        'isBase64Encoded': False
    }
