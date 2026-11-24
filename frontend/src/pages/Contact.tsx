import { FormEvent, useState } from 'react';
import { Box, Button, Container, FormControl, FormLabel, Grid, Heading, Input, Link, Stack, Text, Textarea, useToast } from '@chakra-ui/react';
import { api } from '../api';
import { SHOP } from '../shop';

export default function Contact() {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.contact(form);
      toast({ status: 'success', title: 'Message sent', description: 'We’ll reply by email.' });
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      toast({ status: 'error', title: (err as Error).message });
    } finally { setSending(false); }
  };

  return (
    <Container maxW="6xl" py={10}>
      <Heading as="h1" size="xl" mb={8}>Contact us</Heading>
      <Grid templateColumns={{ base: '1fr', md: '3fr 2fr' }} gap={10}>
        <Box as="form" onSubmit={submit} layerStyle="stitched" p={{ base: 5, md: 8 }}>
          <Stack spacing={4}>
            <FormControl isRequired><FormLabel>Your name</FormLabel><Input value={form.name} maxLength={80} onChange={set('name')} /></FormControl>
            <FormControl isRequired><FormLabel>Email</FormLabel><Input type="email" value={form.email} maxLength={160} onChange={set('email')} /></FormControl>
            <FormControl isRequired><FormLabel>Message</FormLabel><Textarea rows={6} value={form.message} maxLength={2000} onChange={set('message')} /></FormControl>
            <Button type="submit" isLoading={sending} alignSelf="flex-start">Send message</Button>
          </Stack>
        </Box>
        <Stack spacing={3}>
          <Heading as="h2" size="md">Visit or call</Heading>
          <Text>{SHOP.address}</Text>
          <Text>{SHOP.hours}</Text>
          <Link href={`tel:${SHOP.phone}`} color="plum.600" fontWeight="600">{SHOP.phone}</Link>
          <Link href={`mailto:${SHOP.email}`} color="plum.600" fontWeight="600">{SHOP.email}</Link>
        </Stack>
      </Grid>
    </Container>
  );
}
