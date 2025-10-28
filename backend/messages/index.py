import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Get all broadcast messages from database
    Args: event - dict with httpMethod
          context - object with request_id
    Returns: HTTP response with messages list
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    cur.execute('SELECT id, message_text, created_at, sent_at, status, total_recipients, successful_sends, failed_sends FROM t_p76978581_telegram_bot_message.broadcast_messages ORDER BY created_at DESC')
    rows = cur.fetchall()
    
    messages = []
    for row in rows:
        messages.append({
            'id': row[0],
            'message_text': row[1],
            'created_at': row[2].isoformat() if row[2] else None,
            'sent_at': row[3].isoformat() if row[3] else None,
            'status': row[4],
            'total_recipients': row[5],
            'successful_sends': row[6],
            'failed_sends': row[7]
        })
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(messages),
        'isBase64Encoded': False
    }
