import { adminOrSelfField } from '@/access/adminOrSelfField'
import { isAdmin } from '@/access/isAdmin'
import { isAdminField } from '@/access/isAdminField'
import { slugField } from '@/fields/slug'
import type { CollectionConfig } from 'payload'
import { adminOrSelfOrGuests } from './access/adminOrSelfOrGuests'
import { generateJwtToken, verifyJwtToken } from '@/utilities/token'

export const Booking: CollectionConfig = {
  slug: 'bookings',
  labels: {
    singular: 'Booking',
    plural: 'Bookings',
  },
  typescript: {
    interface: 'Booking',
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['customer', 'post', 'fromDate', 'toDate', 'guests'],
  },
  endpoints: [
    // This endpoint is used to generate a token for the booking
    // and return it to the customer
    {
      path: '/:bookingId/token',
      method: 'post',
      handler: async (req) => {
        if (!req.user) {
          return Response.json(
            {
              message: 'Unauthorized',
            },
            { status: 401 },
          )
        }

        const bookingId =
          req.routeParams && 'bookingId' in req.routeParams && req.routeParams.bookingId

        if (!bookingId || typeof bookingId !== 'string') {
          return Response.json(
            {
              message: 'Booking ID not provided',
            },
            { status: 400 },
          )
        }

        try {
          // Use findOneAndUpdate to handle concurrent requests
          const booking = await req.payload.findByID({
            collection: 'bookings',
            id: bookingId,
          })

          if (!booking) {
            return Response.json(
              {
                message: 'Booking not found',
              },
              { status: 404 },
            )
          }

          // Check if user is authorized
          if (
            typeof booking.customer === 'string'
              ? booking.customer !== req.user.id
              : booking.customer?.id !== req.user.id
          ) {
            return Response.json(
              {
                message: 'Unauthorized',
              },
              { status: 401 },
            )
          }

          // If booking already has a token, return it
          if (booking.token) {
            return Response.json({
              token: booking.token,
            })
          }

          // Generate new token
          const token = generateJwtToken({
            bookingId: booking.id,
            customerId:
              typeof booking.customer === 'string' ? booking.customer : booking.customer?.id,
          })

          // Update booking with new token
          await req.payload.update({
            collection: 'bookings',
            id: bookingId,
            data: {
              token,
            },
          })

          return Response.json({
            token,
          })
        } catch (error) {
          console.error('Error generating token:', error)
          return Response.json(
            {
              message: 'Failed to generate token',
            },
            { status: 500 },
          )
        }
      },
    },

    // This endpoint is used to refresh the current token.
    // If the token is refreshed, the old token will be invalidated
    {
      path: '/:bookingId/refresh-token',
      method: 'post',
      handler: async (req) => {
        if (!req.user) {
          return Response.json(
            {
              message: 'Unauthorized',
            },
            { status: 401 },
          )
        }

        const bookingId =
          req.routeParams && 'bookingId' in req.routeParams && req.routeParams.bookingId

        // This is not supposed to happen, but just in case
        if (!bookingId || typeof bookingId !== 'string') {
          return Response.json(
            {
              message: 'Booking ID not provided',
            },
            { status: 400 },
          )
        }

        const bookings = await req.payload.find({
          collection: 'bookings',
          where: {
            and: [
              {
                id: {
                  equals: bookingId,
                },
              },
              {
                customer: {
                  equals: req.user.id,
                },
              },
            ],
          },
          limit: 1,
          pagination: false,
        })

        if (bookings.docs.length === 0) {
          return Response.json(
            {
              message: 'Booking not found',
            },
            { status: 404 },
          )
        }

        const booking = bookings.docs[0]

        if (!booking) {
          return Response.json(
            {
              message: 'Booking not found',
            },
            { status: 404 },
          )
        }

        const token = generateJwtToken({
          bookingId: booking.id,
          customerId:
            typeof booking.customer === 'string' ? booking.customer : booking.customer?.id,
        })

        await req.payload.update({
          collection: 'bookings',
          id: bookingId,
          data: {
            token,
          },
        })
        return Response.json({
          token,
        })
      },
    },

    // This endpoint is used to accept the invite for the booking
    // and add the user to the guests list
    {
      path: '/:bookingId/accept-invite/:token',
      method: 'post',
      handler: async (req) => {
        if (!req.user) {
          return Response.json(
            {
              message: 'Unauthorized',
            },
            { status: 401 },
          )
        }

        const bookingId =
          req.routeParams && 'bookingId' in req.routeParams && req.routeParams.bookingId

        // This is not suppossed to happen, but just in case
        if (!bookingId || typeof bookingId !== 'string') {
          return Response.json(
            {
              message: 'Booking ID not provided',
            },
            { status: 400 },
          )
        }

        const token = req.routeParams && 'token' in req.routeParams && req.routeParams.token

        // This is not suppossed to happen, but just in case
        if (!token || typeof token !== 'string') {
          return Response.json(
            {
              message: 'Token not provided',
            },
            { status: 400 },
          )
        }

        const bookings = await req.payload.find({
          collection: 'bookings',
          where: {
            and: [
              {
                id: {
                  equals: bookingId,
                },
              },
              {
                token: {
                  equals: token,
                },
              },
            ],
          },
          limit: 1,
          pagination: false,
        })

        if (bookings.docs.length === 0) {
          return Response.json(
            {
              message: 'Booking not found',
            },
            { status: 404 },
          )
        }

        const booking = bookings.docs[0]

        if (!booking) {
          return Response.json(
            {
              message: 'Booking not found',
            },
            { status: 404 },
          )
        }

        if (
          booking.guests?.some((guest) =>
            typeof guest === 'string' ? guest === req.user?.id : guest.id === req.user?.id,
          ) ||
          (typeof booking.customer === 'string'
            ? booking.customer === req.user.id
            : booking.customer?.id === req.user.id)
        ) {
          return Response.json({
            message: 'User already in booking',
          })
        }

        await req.payload.update({
          collection: 'bookings',
          id: bookingId,
          data: {
            guests: [...(booking.guests || []), req.user.id],
          },
        })

        return Response.json({
          message: 'Booking updated',
        })
      },
    },

    // Read the token, verify and return the payload
    // This endpoint can be used to get booking id and customer id to fetch the details and show them to the user.
    {
      path: '/token/:token',
      method: 'get',
      handler: async (req) => {
        if (!req.user) {
          return Response.json(
            {
              message: 'Unauthorized',
            },
            { status: 401 },
          )
        }

        const token = req.routeParams && 'token' in req.routeParams && req.routeParams.token

        // This is not suppossed to happen, but just in case
        if (!token || typeof token !== 'string') {
          return Response.json(
            {
              message: 'Token not provided',
            },
            { status: 400 },
          )
        }

        const payload = verifyJwtToken(token)

        return Response.json(payload)
      },
    },

    // This will remove a guest from the booking
    {
      path: '/:bookingId/guests/:guestId',
      method: 'delete',
      handler: async (req) => {
        if (!req.user) {
          return Response.json(
            {
              message: 'Unauthorized',
            },
            { status: 401 },
          )
        }

        const bookingId =
          req.routeParams && 'bookingId' in req.routeParams && req.routeParams.bookingId

        // This is not suppossed to happen, but just in case
        if (!bookingId || typeof bookingId !== 'string') {
          return Response.json(
            {
              message: 'Booking ID not provided',
            },
            { status: 400 },
          )
        }

        const guestId = req.routeParams && 'guestId' in req.routeParams && req.routeParams.guestId

        // This is not suppossed to happen, but just in case
        if (!guestId || typeof guestId !== 'string') {
          return Response.json(
            {
              message: 'Guest ID not provided',
            },
            { status: 400 },
          )
        }

        const bookings = await req.payload.find({
          collection: 'bookings',
          where: {
            and: [
              {
                id: {
                  equals: bookingId,
                },
              },
              {
                guests: {
                  contains: guestId,
                },
              },
              {
                customer: {
                  equals: req.user.id,
                },
              },
            ],
          },
          limit: 1,
          pagination: false,
        })

        if (bookings.docs.length === 0) {
          return Response.json(
            {
              message: 'Booking not found',
            },
            { status: 404 },
          )
        }

        const booking = bookings.docs[0]

        if (!booking || !booking.guests) {
          return Response.json(
            {
              message: 'Booking not found',
            },
            { status: 404 },
          )
        }

        await req.payload.update({
          collection: 'bookings',
          id: bookingId,
          data: {
            guests: booking.guests.filter((guest) =>
              typeof guest === 'string' ? guest !== guestId : guest.id !== guestId,
            ),
          },
        })

        return Response.json({
          message: 'Guest removed from booking',
        })
      },
    },
  ],
  access: {
    create: ({ req: { user } }) => {
      if (!user) return false
      const roles = user.role || []
      return roles.includes('admin') || roles.includes('customer')
    },
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role?.includes('admin')) return true
      if (user.role?.includes('customer')) {
        return { customer: { equals: user.id } }
      }
      return false
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role?.includes('admin')) return true
      if (user.role?.includes('customer')) {
        return { customer: { equals: user.id } }
      }
      return false
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.role?.includes('admin')) return true
      if (user.role?.includes('customer')) {
        return { customer: { equals: user.id } }
      }
      return false
    },
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
      access: {
        update: isAdminField,
      },
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      filterOptions: {
        role: {
          equals: 'customer',
        },
      },
      access: {
        update: isAdminField,
      },
    },
    {
      name: 'token',
      label: 'Token',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
        hidden: true,
      },
    },
    {
      name: 'guests',
      type: 'relationship',
      hasMany: true,
      relationTo: 'users',
      access: {
        update: adminOrSelfField('customer'),
      },
      admin: {
        isSortable: true,
      },
    },
    ...slugField('title', {
      checkboxOverrides: {
        access: {
          update: isAdminField,
        },
      },
      slugOverrides: {
        access: {
          update: isAdminField,
        },
      },
    }),
    {
      name: 'post',
      relationTo: 'posts',
      type: 'relationship',
      required: true,
      access: {
        update: isAdminField,
      },
    },
    {
      name: 'paymentStatus',
      label: 'Payment Status',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      options: [
        {
          label: 'Paid',
          value: 'paid',
        },
        {
          label: 'Unpaid',
          value: 'unpaid',
        },
      ],
      access: {
        update: isAdminField,
      },
    },
    {
      name: 'fromDate',
      type: 'date',
      required: true,
      index: true,
      label: 'Check-in Date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      access: {
        update: isAdminField,
      },
    },
    {
      name: 'toDate',
      type: 'date',
      required: true,
      label: 'Check-out Date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      access: {
        update: isAdminField,
      },
    },
  ],
}
