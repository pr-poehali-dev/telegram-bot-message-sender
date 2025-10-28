INSERT INTO t_p76978581_telegram_bot_message.broadcast_messages (message_text, status, sent_at, total_recipients, successful_sends) VALUES
('Добро пожаловать! Это тестовое сообщение от бота.', 'sent', NOW() - INTERVAL '2 days', 5, 5),
('Новые функции уже доступны! Проверьте обновления.', 'sent', NOW() - INTERVAL '1 day', 5, 4),
('Специальное предложение только для вас!', 'draft', NULL, 0, 0);