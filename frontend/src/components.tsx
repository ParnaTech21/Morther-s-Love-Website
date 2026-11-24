import { Flex, Heading, HStack, Image, LinkBox, LinkOverlay, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import type { Product } from './api';
import { money } from './shop';

export const Stars = ({ value, count }: { value: number; count?: number }) => {
  const n = Math.round(value);
  return (
    <HStack spacing={2} aria-label={count === 0 ? 'No reviews yet' : `Rated ${value.toFixed(1)} out of 5`}>
      <Text color="butter.500" letterSpacing="2px" aria-hidden>
        {'★'.repeat(n)}<Text as="span" color="gray.300">{'★'.repeat(5 - n)}</Text>
      </Text>
      {count !== undefined && <Text fontSize="sm" color="gray.600">{count ? `(${count})` : 'No reviews yet'}</Text>}
    </HStack>
  );
};

// Product photos sit on a soft panel, cut-out style
export const ProductImage = ({ p, h, bg = '#fafafa' }: { p: Product; h: any; bg?: string }) => (
  <Flex h={h} bg={bg} borderRadius="md" align="center" justify="center" overflow="hidden">
    {p.imageUrl
      ? <Image src={p.imageUrl} alt={p.name} maxH="100%" maxW="100%" objectFit="contain" p={4} />
      : <Heading size="3xl" color="#d8cfc8" aria-hidden>{p.name[0]}</Heading>}
  </Flex>
);

export const ProductCard = ({ p }: { p: Product }) => (
  <LinkBox as="article">
    <ProductImage p={p} h={{ base: '240px', md: '300px' }} />
    <LinkOverlay as={RouterLink} to={`/shop/${p.id}`}><Text mt={3} fontWeight="500">{p.name}</Text></LinkOverlay>
    <Flex justify="space-between" align="center" wrap="wrap" gap={1}>
      <Text color="gray.600" fontSize="sm">{money(p.price)}</Text>
      <Stars value={p.averageRating} count={p.reviewCount} />
    </Flex>
  </LinkBox>
);
