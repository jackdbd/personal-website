const resourceNotOwned = (cloud_name, data) => {
  return `Your Cloudinary cloud_name is ${cloud_name}. You cannot fetch the resource with public_id ${data.public_id} because it belongs to cloud_name ${data.cloud_name}`
}

module.exports = { resourceNotOwned }
