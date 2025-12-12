import { books } from "@/lib/placeholder-data";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function AdminBooksPage() {
    return (
        <div>
            <h1 className="font-headline text-3xl font-bold mb-6">Book Management</h1>
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Book Title</TableHead>
                            <TableHead>Author</TableHead>
                            <TableHead>Chapters</TableHead>
                            <TableHead>Hashtags</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {books.map(book => {
                            const coverImage = PlaceHolderImages.find(p => p.id === book.coverImageId);
                            return (
                                <TableRow key={book.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            {coverImage &&
                                                <Image src={coverImage.imageUrl} alt={book.title} width={40} height={60} className="rounded-sm object-cover"/>
                                            }
                                            <span className="font-medium">{book.title}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{book.author}</TableCell>
                                    <TableCell>{book.chapters.length}</TableCell>
                                    <TableCell className="max-w-xs truncate">{book.hashtags.join(', ')}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem>View Book</DropdownMenuItem>
                                                <DropdownMenuItem>Unpublish Book</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Delete Book</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
