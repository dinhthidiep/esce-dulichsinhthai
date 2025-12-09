using System.Threading.Tasks;

namespace ESCE_SYSTEM.Services
{
    public interface IPostSaveService
    {
        Task SavePost(int postId);
        Task UnsavePost(int postId);
    }
}