using ESCE_SYSTEM.Services.RoleService;
using ESCE_SYSTEM.DTOs;
using ESCE_SYSTEM.Services.UserService;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ESCE_SYSTEM.Controllers
{
    [Route("api/[controller]")]
    public class RoleController : ControllerBase
    {
        private readonly IRoleService _roleService;
        public RoleController(IRoleService roleService)
        {
            _roleService = roleService;
        }
        [HttpGet("GetPublicRoles")]
        public async Task<ActionResult> GetPublicRoles()
        {
            try
            {
                return Ok(await _roleService.GetPublicRole());
            }
            catch (Exception ex)
            {
                return BadRequest();
            }
        }
    }
}
