import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from '@/lib/axios'

interface ProfileData {
  username: string
  email: string
  mbti: string | null
  profile_image: string | null
}

interface UpdateProfileData {
  username?: string
  email?: string
  mbti?: string
}

interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

export const useProfile = () => {
  return useQuery<ProfileData>({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await axios.get('/api/user/profile')
      return data
    }
  })
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (profileData: UpdateProfileData) => {
      const { data } = await axios.put('/api/user/profile', profileData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    }
  })
}

export const useUpdateProfileImage = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await axios.post('/api/user/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    }
  })
}

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (passwordData: ChangePasswordData) => {
      const { data } = await axios.post('/api/user/change-password', passwordData)
      return data
    }
  })
}