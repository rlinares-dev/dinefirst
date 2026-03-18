#!/usr/bin/env node
/**
 * Generate VAPID keys for Web Push Notifications.
 * Run: node scripts/generate-vapid-keys.js
 * Then add the output to your .env.local
 */

const webpush = require('web-push')
const vapidKeys = webpush.generateVAPIDKeys()

console.log('Add these to your .env.local:\n')
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`)
