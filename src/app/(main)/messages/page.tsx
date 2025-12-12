import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { messages } from "@/lib/placeholder-data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";
import { MessageSquare, Send } from "lucide-react";

export default function MessagesPage() {
    const selectedConversation = messages[0];
    const contactAvatar = PlaceHolderImages.find(img => img.id === selectedConversation.contactAvatarId);

    return (
        <div className="container py-8 md:py-12">
             <div className="flex items-center gap-4 mb-8">
                <MessageSquare className="h-8 w-8 text-primary" />
                <h1 className="font-headline text-4xl font-bold">Messages</h1>
            </div>
            <Card className="h-[calc(100vh-200px)]">
                <div className="grid grid-cols-12 h-full">
                    <div className="col-span-4 border-r">
                        <div className="p-4 border-b">
                            <Input placeholder="Search conversations..." />
                        </div>
                        <ScrollArea className="h-[calc(100%-65px)]">
                            {messages.map((msg) => {
                                const avatar = PlaceHolderImages.find(img => img.id === msg.contactAvatarId);
                                return (
                                    <div key={msg.id} className={cn("p-4 border-b flex items-start gap-4 cursor-pointer hover:bg-secondary", msg.id === selectedConversation.id && "bg-secondary")}>
                                        <Avatar>
                                            {avatar && <AvatarImage src={avatar.imageUrl} alt={msg.contactName} />}
                                            <AvatarFallback>{msg.contactName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex justify-between">
                                                <p className="font-semibold">{msg.contactName}</p>
                                                <p className="text-xs text-muted-foreground">{msg.timestamp}</p>
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">{msg.lastMessage}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </ScrollArea>
                    </div>
                    <div className="col-span-8 flex flex-col h-full">
                        <div className="p-4 border-b flex items-center gap-4">
                            <Avatar>
                                {contactAvatar && <AvatarImage src={contactAvatar.imageUrl} alt={selectedConversation.contactName} />}
                                <AvatarFallback>{selectedConversation.contactName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <h2 className="font-headline text-xl font-semibold">{selectedConversation.contactName}</h2>
                        </div>
                        <ScrollArea className="flex-1 p-6">
                            <div className="flex flex-col gap-4">
                                {selectedConversation.conversation.map((chat, index) => (
                                    <div key={index} className={cn("flex", chat.sender === 'me' ? 'justify-end' : 'justify-start')}>
                                        <div className={cn("max-w-[70%] p-3 rounded-lg", chat.sender === 'me' ? 'bg-primary text-primary-foreground' : 'bg-secondary')}>
                                            <p>{chat.text}</p>
                                            <p className={cn("text-xs mt-1", chat.sender === 'me' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{chat.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <div className="p-4 border-t">
                            <div className="relative">
                                <Input placeholder="Type a message..." className="pr-12 h-12" />
                                <Button size="icon" className="absolute top-1/2 right-2 -translate-y-1/2">
                                    <Send />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
