import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface Subscriber {
  id: number;
  telegram_id: number;
  username: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  subscribed_at: string;
}

interface BroadcastMessage {
  id: number;
  message_text: string;
  created_at: string;
  sent_at: string | null;
  status: string;
  total_recipients: number;
  successful_sends: number;
  failed_sends: number;
}

interface Stats {
  totalSubscribers: number;
  activeSubscribers: number;
  totalMessages: number;
  sentMessages: number;
}

export default function Index() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [messages, setMessages] = useState<BroadcastMessage[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalSubscribers: 0,
    activeSubscribers: 0,
    totalMessages: 0,
    sentMessages: 0
  });
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const subsResponse = await fetch('/api/subscribers');
      const subsData = await subsResponse.json();
      setSubscribers(subsData);

      const messagesResponse = await fetch('/api/messages');
      const messagesData = await messagesResponse.json();
      setMessages(messagesData);

      const activeCount = subsData.filter((s: Subscriber) => s.is_active).length;
      const sentCount = messagesData.filter((m: BroadcastMessage) => m.status === 'sent').length;

      setStats({
        totalSubscribers: subsData.length,
        activeSubscribers: activeCount,
        totalMessages: messagesData.length,
        sentMessages: sentCount
      });
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      toast.error('Введите текст сообщения');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage })
      });

      if (response.ok) {
        toast.success('Рассылка отправлена!');
        setNewMessage('');
        loadData();
      } else {
        toast.error('Ошибка отправки');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Ошибка отправки');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="container mx-auto p-6 max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Icon name="Send" size={32} className="text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Telegram Bot Admin</h1>
          </div>
          <p className="text-muted-foreground">Управление рассылками и подписчиками</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="hover-scale">
            <CardHeader className="pb-3">
              <CardDescription>Всего подписчиков</CardDescription>
              <CardTitle className="text-3xl">{stats.totalSubscribers}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon name="Users" size={16} />
                <span>Активных: {stats.activeSubscribers}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="pb-3">
              <CardDescription>Всего рассылок</CardDescription>
              <CardTitle className="text-3xl">{stats.totalMessages}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon name="MessageSquare" size={16} />
                <span>Отправлено: {stats.sentMessages}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="pb-3">
              <CardDescription>Успешных доставок</CardDescription>
              <CardTitle className="text-3xl">
                {messages.reduce((acc, m) => acc + m.successful_sends, 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-success">
                <Icon name="CheckCircle2" size={16} className="text-green-600" />
                <span className="text-muted-foreground">Доставлено</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="pb-3">
              <CardDescription>Ошибок доставки</CardDescription>
              <CardTitle className="text-3xl">
                {messages.reduce((acc, m) => acc + m.failed_sends, 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-destructive">
                <Icon name="XCircle" size={16} className="text-red-600" />
                <span className="text-muted-foreground">Не доставлено</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="broadcast" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="broadcast">
              <Icon name="Send" size={16} className="mr-2" />
              Рассылка
            </TabsTrigger>
            <TabsTrigger value="messages">
              <Icon name="MessageSquare" size={16} className="mr-2" />
              История
            </TabsTrigger>
            <TabsTrigger value="subscribers">
              <Icon name="Users" size={16} className="mr-2" />
              Подписчики
            </TabsTrigger>
          </TabsList>

          <TabsContent value="broadcast" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Создать рассылку</CardTitle>
                <CardDescription>
                  Отправьте сообщение всем активным подписчикам бота
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Textarea
                    placeholder="Введите текст сообщения..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="min-h-[200px] resize-none"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Получателей: {stats.activeSubscribers}
                  </p>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={loading || !newMessage.trim()}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Icon name="Send" size={16} className="mr-2" />
                      Отправить рассылку
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>История рассылок</CardTitle>
                <CardDescription>Все отправленные и черновые сообщения</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Icon name="MessageSquare" size={48} className="mx-auto mb-2 opacity-50" />
                      <p>Нет сообщений</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant={message.status === 'sent' ? 'default' : 'secondary'}>
                            {message.status === 'sent' ? 'Отправлено' : 'Черновик'}
                          </Badge>
                          {message.sent_at && (
                            <span className="text-sm text-muted-foreground">
                              {formatDate(message.sent_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm mb-3 line-clamp-2">{message.message_text}</p>
                        {message.status === 'sent' && (
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Icon name="Users" size={14} />
                              {message.total_recipients}
                            </span>
                            <span className="flex items-center gap-1 text-green-600">
                              <Icon name="CheckCircle2" size={14} />
                              {message.successful_sends}
                            </span>
                            {message.failed_sends > 0 && (
                              <span className="flex items-center gap-1 text-red-600">
                                <Icon name="XCircle" size={14} />
                                {message.failed_sends}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscribers" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Подписчики</CardTitle>
                <CardDescription>Список всех пользователей бота</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {subscribers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Icon name="Users" size={48} className="mx-auto mb-2 opacity-50" />
                      <p>Нет подписчиков</p>
                    </div>
                  ) : (
                    subscribers.map((subscriber) => (
                      <div
                        key={subscriber.id}
                        className="flex items-center justify-between border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Icon name="User" size={20} className="text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {subscriber.first_name} {subscriber.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">@{subscriber.username}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={subscriber.is_active ? 'default' : 'secondary'}>
                            {subscriber.is_active ? 'Активен' : 'Неактивен'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(subscriber.subscribed_at)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
