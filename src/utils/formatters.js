export const formatters = {
    currency: (value) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value)
    },
    
    date: (value) => {
      return new Intl.DateTimeFormat('en-US', {
        date: 'medium',
      }).format(new Date(value))
    },
    
    time: (value) => {
      return new Intl.DateTimeFormat('en-US', {
        time: 'short',
      }).format(new Date(value))
    },
    
    datetime: (value) => {
      return new Intl.DateTimeFormat('en-US', {
        date: 'medium',
        time: 'short',
      }).format(new Date(value))
    },
    
    number: (value) => {
      return new Intl.NumberFormat('en-US').format(value)
    },
    
    percentage: (value) => {
      return `${value}%`
    },
  }