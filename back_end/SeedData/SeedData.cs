using ESCE_SYSTEM.Models;
using ESCE_SYSTEM.Repositories.RoleRepository;
using ESCE_SYSTEM.Repositories.UserRepository;
using ESCE_SYSTEM.Services.RoleService;
using ESCE_SYSTEM.Services.UserService;
using ESCE_SYSTEM.DTOs.Users;
using ESCE_SYSTEM.DTOs;

namespace ESCE_SYSTEM.SeedData
{
    public class SeedData
    {
        public static async Task Initialize(
            IUserService userService,
            IRoleService roleService,
            IRoleRepository roleRepository,
            IUserRepository userRepository)
        {
            // Seed Roles

            // Role 1: Admin
            var roleAdmin = await roleService.GetRoleById(1);
            if (roleAdmin == null)
            {
                await roleRepository.AddAsync(new Role
                {
                    /*Id = 1,*/
                    Name = "Admin",
                    Description = "Quản trị viên hệ thống"
                });
            }

            
            var roleHost = await roleService.GetRoleById(2);
            if (roleHost == null)
            {
                await roleRepository.AddAsync(new Role
                {
                   /* Id = 2,*/
                    Name = "Host",
                    Description = "Chủ farm/Người tổ chức tour" // Role 2
                });
            }

            
            var roleAgency = await roleService.GetRoleById(3);
            if (roleAgency == null)
            {
                await roleRepository.AddAsync(new Role
                {
                    /*Id = 3,*/
                    Name = "Agency", // Role 3
                    Description = "Người dùng đặt tour cho nhiều người/Công ty"
                });
            }

            // Role 4: Customer
            var roleCustomer = await roleService.GetRoleById(4);
            if (roleCustomer == null)
            {
                await roleRepository.AddAsync(new Role
                {
                   /* Id = 4,*/
                    Name = "Customer",
                    Description = "Người dùng tham gia tour cá nhân"
                });
            }

            // Seed Admin Account

            var admin = await userService.GetUserByUsernameAsync("admin@gmail.com");
            if (admin == null)
            {
                var newAdmin = new RegisterUserDto
                {
                    UserEmail = "admin@gmail.com",
                    Password = "123456",
                    FullName = "System Admin",
                    Phone = "123456789"

                };

                await userService.CreateUserAsync(newAdmin, false, false,1);
            }
        }
    }
}